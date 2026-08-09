#!/usr/bin/env bash
set -euo pipefail

# Safe deploy script for delta-be
# Usage: safe_deploy.sh <deploy_dir> <backup_dir_root> <artifact_dir>

DEPLOY_DIR=${1:-~/app}
BACKUP_ROOT=${2:-~/backups/delta-be}
ARTIFACT_DIR=${3:-.}
KEEP_BACKUPS=${4:-5}
PM2_NAME=${PM2_NAME:-delta-be}
PORT=${PORT:-4000}
HEALTH_URL=${HEALTH_URL:-https://delta-api.cerbon.id:${PORT}/api/health}

# Prevent OOM crashes during TypeScript builds in constrained deployment environments.
# The default V8 heap is often too low on smaller droplets and CI runners.
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"

# PM2 log paths
PM2_LOG_DIR=${PM2_LOG_DIR:-"${PM2_HOME:-$HOME/.pm2}/logs"}
OUT_LOG="$PM2_LOG_DIR/${PM2_NAME}-out.log"

timestamp() { date -u +"%Y%m%dT%H%M%SZ"; }
log() { echo "[$(timestamp)] $*"; }

mkdir -p "$BACKUP_ROOT"

# Rotate backups: keep latest $KEEP_BACKUPS
rotate_backups() {
  local keep="$KEEP_BACKUPS"
  log "Rotating backups, keeping latest $keep"
  # Safely collect backup directories (handle empty backup dir without failing)
  mapfile -t arr < <(ls -1dt "$BACKUP_ROOT"/* 2>/dev/null || true)
  if [ ${#arr[@]} -le "$keep" ]; then
    log "No old backups to remove"
    return 0
  fi
  to_remove=( "${arr[@]:$keep}" )
  for r in "${to_remove[@]}"; do
    log "Removing old backup: $r"
    rm -rf "$r"
  done
}

# Ensure a command is present; attempt to install common tools automatically.
# This makes deploys to fresh droplets more resilient when required tools are missing.
ensure_command() {
  local cmd="$1"
  local hint="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    return 0
  fi
  log "Command '$cmd' not found; attempting automated install"

  # prefer sudo when available, otherwise require root
  local SUDO=""
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  elif [ "$(id -u)" -ne 0 ]; then
    log "Cannot install $cmd: neither sudo nor root privileges available"
    return 1
  fi

  case "$cmd" in
    node|npm)
      # Allow overriding desired major via NODE_INSTALL_VERSION env var (default 20)
      NODE_INSTALL_VERSION="${NODE_INSTALL_VERSION:-20}"
      if command -v curl >/dev/null 2>&1; then
        log "Using NodeSource setup script to install Node $NODE_INSTALL_VERSION.x"
        if ! curl -fsSL "https://deb.nodesource.com/setup_${NODE_INSTALL_VERSION}.x" | $SUDO -E bash -; then
          log "NodeSource setup failed; falling back to apt packages"
        fi
      else
        log "curl not found; installing curl first"
        DEBIAN_FRONTEND=noninteractive $SUDO apt-get update -qq
        DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq curl
        if ! curl -fsSL "https://deb.nodesource.com/setup_${NODE_INSTALL_VERSION}.x" | $SUDO -E bash -; then
          log "NodeSource setup failed after installing curl; falling back to apt packages"
        fi
      fi
      DEBIAN_FRONTEND=noninteractive $SUDO apt-get update -qq
      DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq nodejs || {
        log "Failed to install nodejs from NodeSource/apt"
        return 1
      }
      ;;
    pm2)
      # pm2 requires npm; ensure npm/node first
      ensure_command npm || return 1
      log "Installing pm2 globally via npm"
      if ! $SUDO npm install -g pm2 --silent; then
        log "Global npm install of pm2 failed; trying without sudo"
        if ! npm install -g pm2 --silent; then
          log "Failed to install pm2"
          return 1
        fi
      fi
      ;;
    curl)
      DEBIAN_FRONTEND=noninteractive $SUDO apt-get update -qq
      DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq curl
      ;;
    *)
      log "No automated installer configured for '$cmd' - $hint"
      return 1
      ;;
  esac

  if command -v "$cmd" >/dev/null 2>&1; then
    log "Successfully installed '$cmd'"
    return 0
  fi
  log "Automated install attempted but '$cmd' still not available"
  return 1
}


# Create a backup snapshot of a specific deployment directory
create_backup_from_dir() {
  local source_dir="$1"
  local bdir="$BACKUP_ROOT/$(timestamp)"
  # Write a human-friendly creation message to stderr so command
  # substitution receives only the path on stdout.
  printf "[%s] Creating backup %s from %s\n" "$(timestamp)" "$bdir" "$source_dir" >&2
  mkdir -p "$bdir"
  rsync -a --delete "$source_dir/" "$bdir/"
  printf "%s\n" "$bdir"
}

# Create backup of current app
create_backup() {
  create_backup_from_dir "$DEPLOY_DIR"
}

# Restore backup
restore_backup() {
  local bdir="$1"
  # Sanitize the incoming backup identifier: use the last non-empty line
  # in case create_backup output included extra log lines when captured.
  bdir="$(printf '%s' "$bdir" | sed -n '$p')"
  if [ ! -d "$bdir" ]; then
    log "Backup directory not found: $bdir"
    return 1
  fi
  log "Restoring backup from $bdir"
  rm -rf "$DEPLOY_DIR.old" || true
  if [ -d "$DEPLOY_DIR" ]; then
    mv "$DEPLOY_DIR" "$DEPLOY_DIR.old" || true
  fi
  mv "$bdir" "$DEPLOY_DIR"
  log "Restarting PM2 with restored version"
  NODE_ENV=production pm2 restart "$PM2_NAME" --update-env || NODE_ENV=production pm2 start "$DEPLOY_DIR/dist/index.js" --name "$PM2_NAME" --update-env
}

restore_previous_release() {
  local backup_path="$1"
  if [ -n "$backup_path" ] && [ -d "$backup_path" ]; then
    restore_backup "$backup_path"
    return 0
  fi
  if [ -d "$DEPLOY_DIR.old" ] && [ "$(ls -A "$DEPLOY_DIR.old" 2>/dev/null || true)" ]; then
    restore_backup "$DEPLOY_DIR.old"
    return 0
  fi
  log "No previous deployment available to restore"
  return 1
}

# Wait for PM2 process to report running
wait_for_pm2() {
  local retries=10
  local delay=2
  log "Waiting for PM2 to report process $PM2_NAME is online"
  for i in $(seq 1 $retries); do
    if pm2 pid "$PM2_NAME" >/dev/null 2>&1; then
      log "PM2 reports process $PM2_NAME running"
      return 0
    fi
    log "PM2 not running yet ($i/$retries), sleeping $delay seconds"
    sleep $delay
  done
  return 1
}

# Rotate the PM2 out log so only fresh logs are inspected
rotate_pm2_log() {
  mkdir -p "$PM2_LOG_DIR"
  if [ -f "$OUT_LOG" ]; then
    mv "$OUT_LOG" "$OUT_LOG.$(timestamp).old" || true
  fi
  touch "$OUT_LOG"
}

# Wait for application startup log indicating DB verified
wait_for_db_verified_log() {
  local app_dir="$1"
  local retries=45
  local delay=2
  local log_pattern="Database connection verified"
  log "Waiting for database verification in PM2 logs (up to $((retries*delay))s) checking $OUT_LOG"
  for i in $(seq 1 $retries); do
    if compgen -G "$PM2_LOG_DIR/${PM2_NAME}-*.log" > /dev/null 2>&1; then
      if grep -R -h -q "$log_pattern" "$PM2_LOG_DIR"/${PM2_NAME}-*.log 2>/dev/null; then
        log "Database connection verified by application logs"
        return 0
      fi
    elif [ -f "$OUT_LOG" ] && tail -n 200 "$OUT_LOG" 2>/dev/null | grep -q "$log_pattern"; then
      log "Database connection verified by application logs"
      return 0
    fi

    if verify_database_from_release "$app_dir"; then
      log "Database connection verified by runtime query"
      return 0
    fi

    sleep "$delay"
  done
  return 1
}

# Verify the app can reach the database using the built startup check
verify_database_from_release() {
  local app_dir="$1"
  local startup_check="$app_dir/dist/utils/startupCheck.js"
  if [ ! -f "$startup_check" ]; then
    log "Startup check module not found at $startup_check"
    return 1
  fi
  log "Verifying database connectivity from $app_dir"
  (
    cd "$app_dir"
    NODE_ENV=production PORT="${PORT:-4000}" node -e "const { verifyDatabaseConnection } = require('./dist/utils/startupCheck'); verifyDatabaseConnection().then((ok) => { if (!ok) process.exit(1); }).catch((err) => { console.error(err); process.exit(1); });"
  )
}

# Wait for the database check to succeed for a release directory
wait_for_database_verification() {
  local app_dir="$1"
  local retries=30
  local delay=2
  log "Waiting for database verification for $app_dir (up to $((retries*delay))s)"
  for i in $(seq 1 $retries); do
    if verify_database_from_release "$app_dir"; then
      return 0
    fi
    sleep "$delay"
  done
  return 1
}

# Health check
check_health_for_url() {
  local url="$1"
  local retries=30
  local delay=2
  local curl_args=(curl -sS --fail --max-time 5)
  if [[ "$url" == https://* ]]; then
    curl_args+=(--insecure)
  fi
  log "Checking health endpoint $url"
  for i in $(seq 1 $retries); do
    if "${curl_args[@]}" "$url" | grep -q '"status".*"ok"'; then
      log "Health endpoint reports OK"
      return 0
    fi
    log "Health check failed ($i/$retries), retrying in $delay seconds"
    sleep "$delay"
  done
  return 1
}

check_health() {
  check_health_for_url "$HEALTH_URL"
}

main() {
  # Prepare a temporary release directory where we stage, install and build
  local release_tmp="$BACKUP_ROOT/release-$(timestamp)"
  log "Preparing release in $release_tmp"
  mkdir -p "$release_tmp"

  log "Uploading new release to temporary dir"
  rsync -az --delete "$ARTIFACT_DIR/" "$release_tmp/"

  log "Installing dependencies and building in temporary release"
  # Ensure required tools are available on fresh droplets; fail early if automatic
  # installation cannot provide them.
  if ! ensure_command npm "install nodejs/npm (requires sudo)"; then
    log "npm is required but could not be installed automatically; aborting"
    exit 1
  fi
  if ! ensure_command pm2 "install pm2 globally via npm"; then
    log "pm2 is required but could not be installed automatically; aborting"
    exit 1
  fi

  cd "$release_tmp"
  npm ci
  npm run build

  # Export environment from the staged .env.production for seed/prisma if present
  if [ -f "$release_tmp/.env.production" ]; then
    log "Exporting environment from $release_tmp/.env.production for staged release"
    set -a
    # shellcheck source=/dev/null
    . "$release_tmp/.env.production"
    set +a

    if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_HOST:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_NAME:-}" ]; then
      DB_PORT_VAL="${DB_PORT:-3306}"
      export DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD:-}@${DB_HOST}:${DB_PORT_VAL}/${DB_NAME}"
      log "Constructed DATABASE_URL for staged release from DB_* variables"
    fi
  fi

  # Run the staged release directly on a test port so it doesn't conflict with the live process
  local test_port
  test_port=$((PORT + 1))
  local candidate_log="$release_tmp/candidate.log"
  log "Starting staged release for verification on port $test_port (logs: $candidate_log)"
  # start node directly so PM2 isn't disturbed; redirect output to candidate log
  NODE_ENV=production PORT="$test_port" node dist/index.js > "$candidate_log" 2>&1 &
  local candidate_pid=$!

  # Wait for the staged release to prove the database is reachable before treating it as valid
  local verified=1
  if wait_for_database_verification "$release_tmp"; then
    if check_health_for_url "https://127.0.0.1:${test_port}/api/health"; then
      log "Staged release verified DB connection and health endpoint"
      verified=0
    fi
  fi

  # Tear down candidate process
  if ps -p "$candidate_pid" > /dev/null 2>&1; then
    log "Stopping staged release (pid $candidate_pid)"
    kill "$candidate_pid" || true
    # give it a moment
    sleep 1
  fi

  if [ "$verified" -ne 0 ]; then
    log "Staged release verification failed; cleaning up and aborting"
    rm -rf "$release_tmp"
    exit 1
  fi

  # Atomically swap in the new release
  log "Swapping in new release"
  rm -rf "$DEPLOY_DIR.old" || true
  if [ -d "$DEPLOY_DIR" ]; then
    mv "$DEPLOY_DIR" "$DEPLOY_DIR.old"
  fi
  mv "$release_tmp" "$DEPLOY_DIR"

  # Restart PM2 with the new release (stop old process first to free the port)
  if pm2 pid "$PM2_NAME" >/dev/null 2>&1; then
    log "Stopping existing PM2 process $PM2_NAME before starting new one"
    pm2 stop "$PM2_NAME" || true
  fi

  local backup=""
  NODE_ENV=production pm2 start "$DEPLOY_DIR/dist/index.js" --name "$PM2_NAME" --update-env || {
    log "Failed to start PM2 process for new release"
    log "Attempting to restore previous release"
    restore_previous_release "$backup" || true
    exit 1
  }

  # Wait for PM2 and then verify via PM2-managed logs and public health
  if ! wait_for_pm2; then
    log "PM2 failed to start new process after swap"
    log "Attempting to restore previous release"
    restore_previous_release "$backup" || true
    exit 1
  fi

  rotate_pm2_log

  if ! wait_for_db_verified_log "$DEPLOY_DIR"; then
    log "Database verification failed for PM2-managed process"
    log "Attempting to restore previous release"
    restore_previous_release "$backup" || true
    exit 1
  fi

  if ! verify_database_from_release "$DEPLOY_DIR"; then
    log "Database verification failed for the promoted release"
    log "Attempting to restore previous release"
    restore_previous_release "$backup" || true
    exit 1
  fi

  if ! check_health; then
    log "Health check failed for PM2-managed process"
    log "Attempting to restore previous release"
    restore_previous_release "$backup" || true
    exit 1
  fi

  log "Staged release verified. Creating backup of the previous deployment (if present)"
  if [ -d "$DEPLOY_DIR.old" ] && [ "$(ls -A "$DEPLOY_DIR.old" 2>/dev/null || true)" ]; then
    backup=$(create_backup_from_dir "$DEPLOY_DIR.old")
    rm -rf "$DEPLOY_DIR.old"
  else
    log "No existing deployment found; skipping backup creation"
  fi

  log "Deployment successful"
  rotate_backups
  exit 0
}

main "$@"
