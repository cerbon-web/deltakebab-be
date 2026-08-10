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
HEALTH_URL=${HEALTH_URL:-https://127.0.0.1:${PORT}/api/health}
TLS_RESOLVED_KEY=""
TLS_RESOLVED_CERT=""

# Prevent OOM crashes during TypeScript builds in constrained deployment environments.
# The default V8 heap is often too low on smaller droplets and CI runners.
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
export DEBIAN_FRONTEND=noninteractive

# PM2 log paths
PM2_LOG_DIR=${PM2_LOG_DIR:-"${PM2_HOME:-$HOME/.pm2}/logs"}
OUT_LOG="$PM2_LOG_DIR/${PM2_NAME}-out.log"

resolve_node_version() {
  if [ -n "${NODE_INSTALL_VERSION:-}" ]; then
    return 0
  fi

  local package_json_path="${ARTIFACT_DIR}/package.json"
  if [ -f "$package_json_path" ] && command -v python3 >/dev/null 2>&1; then
    local resolved
    resolved=$(python3 - "$package_json_path" <<'PY'
import json, pathlib, sys
p = pathlib.Path(sys.argv[1])
if not p.exists():
    raise SystemExit(0)
try:
    data = json.loads(p.read_text())
except Exception:
    raise SystemExit(0)
eng = data.get('engines', {}).get('node')
if not eng:
    raise SystemExit(0)
print(str(eng).split('.')[0])
PY
)
    if [ -n "$resolved" ]; then
      NODE_INSTALL_VERSION="$resolved"
    fi
  fi

  NODE_INSTALL_VERSION="${NODE_INSTALL_VERSION:-22}"
}

timestamp() { date -u +"%Y%m%dT%H%M%SZ"; }
log() { echo "[$(timestamp)] $*"; }

ensure_deployment_paths() {
  local user group
  user="$(whoami)"
  group="$(id -gn)"

  log "Ensuring deployment paths are writable: $DEPLOY_DIR and $BACKUP_ROOT"
  if [ -d "$HOME" ] && [ -w "$HOME" ]; then
    mkdir -p "$DEPLOY_DIR" "$BACKUP_ROOT"
    return 0
  fi

  if [ -n "${SUDO_PASSWORD:-}" ]; then
    printf '%s\n' "$SUDO_PASSWORD" | sudo -S mkdir -p "$DEPLOY_DIR" "$BACKUP_ROOT" >/dev/null 2>&1 || true
    printf '%s\n' "$SUDO_PASSWORD" | sudo -S chown -R "$user:$group" "$HOME" "$DEPLOY_DIR" "$BACKUP_ROOT" >/dev/null 2>&1 || true
    printf '%s\n' "$SUDO_PASSWORD" | sudo -S chmod 755 "$HOME" "$DEPLOY_DIR" "$BACKUP_ROOT" >/dev/null 2>&1 || true
  else
    mkdir -p "$DEPLOY_DIR" "$BACKUP_ROOT" >/dev/null 2>&1 || true
  fi

  mkdir -p "$DEPLOY_DIR" "$BACKUP_ROOT"
}

ensure_deployment_paths

should_skip_remote_build() {
  local release_dir="$1"
  if [ "${SKIP_REMOTE_BUILD:-}" = "1" ] || [ "${SKIP_REMOTE_BUILD:-}" = "true" ] || [ "${SKIP_REMOTE_BUILD:-}" = "TRUE" ]; then
    return 0
  fi
  [ -d "$release_dir/dist" ] && [ -d "$release_dir/node_modules" ]
}

ensure_database_prerequisites() {
  local app_dir="$1"
  local db_host="${DB_HOST:-}"
  local db_port="${DB_PORT:-3306}"
  local db_user="${DB_USER:-}"
  local db_password="${DB_PASSWORD:-}"
  local db_name="${DB_NAME:-}"
  local db_url="${DATABASE_URL:-}"

  if [ -f "$app_dir/.env.production" ]; then
    log "Loading database settings from $app_dir/.env.production"
    local saved_ssl_key="$SSL_KEY_PATH"
    local saved_ssl_cert="$SSL_CERT_PATH"
    local saved_ssl_ca="$SSL_CA_PATH"

    set -a
    # shellcheck source=/dev/null
    . "$app_dir/.env.production"
    set +a

    db_host="${DB_HOST:-$db_host}"
    db_port="${DB_PORT:-$db_port}"
    db_user="${DB_USER:-$db_user}"
    db_password="${DB_PASSWORD:-$db_password}"
    db_name="${DB_NAME:-$db_name}"
    db_url="${DATABASE_URL:-$db_url}"

    if [ -n "$saved_ssl_key" ]; then
      export SSL_KEY_PATH="$saved_ssl_key"
    fi
    if [ -n "$saved_ssl_cert" ]; then
      export SSL_CERT_PATH="$saved_ssl_cert"
    fi
    if [ -n "$saved_ssl_ca" ]; then
      export SSL_CA_PATH="$saved_ssl_ca"
    fi
  fi

  if [ -z "$db_user" ] && [ -n "$db_url" ]; then
    db_user="$(python3 - <<'PY' "$db_url"
import sys
from urllib.parse import urlparse
u = urlparse(sys.argv[1])
print(u.username or '')
PY
)"
  fi

  if [ -z "$db_name" ] && [ -n "$db_url" ]; then
    db_name="$(python3 - <<'PY' "$db_url"
import sys
from urllib.parse import urlparse
u = urlparse(sys.argv[1])
print(u.path.lstrip('/') or '')
PY
)"
  fi

  if [ -z "$db_host" ]; then
    db_host="127.0.0.1"
  fi

  case "$db_host" in
    127.0.0.1|localhost|::1|0.0.0.0)
      ;;
    *)
      log "Database host is remote ($db_host); skipping local database bootstrap"
      return 0
      ;;
  esac

  if [ -z "$db_user" ] || [ -z "$db_name" ]; then
    log "Database prerequisites skipped: missing DB_USER or DB_NAME"
    return 0
  fi

  if ! command -v mysql >/dev/null 2>&1; then
    log "Installing MariaDB client/server for local database bootstrap"
    if ! run_sudo apt-get update -qq || ! run_sudo apt-get install -y -qq mariadb-server mariadb-client; then
      log "Failed to install MariaDB; continuing without local database bootstrap"
      return 0
    fi
  fi

  if command -v systemctl >/dev/null 2>&1; then
    run_sudo systemctl enable --now mariadb >/dev/null 2>&1 || run_sudo systemctl enable --now mysql >/dev/null 2>&1 || true
  else
    run_sudo service mariadb start >/dev/null 2>&1 || run_sudo service mysql start >/dev/null 2>&1 || true
  fi

  local sql
  sql="CREATE DATABASE IF NOT EXISTS \`$db_name\`;"
  sql+="CREATE USER IF NOT EXISTS '$db_user'@'localhost' IDENTIFIED BY '$db_password';"
  sql+="GRANT ALL PRIVILEGES ON \`$db_name\`.* TO '$db_user'@'localhost';"
  sql+="CREATE USER IF NOT EXISTS '$db_user'@'%' IDENTIFIED BY '$db_password';"
  sql+="GRANT ALL PRIVILEGES ON \`$db_name\`.* TO '$db_user'@'%';"
  sql+="FLUSH PRIVILEGES;"

  if run_sudo mysql -uroot -e "$sql" >/dev/null 2>&1; then
    log "Prepared local MySQL/MariaDB database '$db_name' for user '$db_user'"
    return 0
  fi

  if run_sudo mysql -e "$sql" >/dev/null 2>&1; then
    log "Prepared local MySQL/MariaDB database '$db_name' for user '$db_user'"
    return 0
  fi

  log "Local database bootstrap completed with warnings; continuing"
}

sudo_test_file() {
  local file_path="$1"
  if [ -z "$file_path" ]; then
    return 1
  fi

  if [ -f "$file_path" ]; then
    return 0
  fi

  if run_sudo test -f "$file_path" >/dev/null 2>&1; then
    return 0
  fi

  return 1
}

resolve_existing_tls_paths() {
  local ssl_domain="$1"
  local requested_key="${2:-}"
  local requested_cert="${3:-}"

  TLS_RESOLVED_KEY=""
  TLS_RESOLVED_CERT=""

  if [ -n "$requested_key" ] && sudo_test_file "$requested_key" && [ -n "$requested_cert" ] && sudo_test_file "$requested_cert"; then
    TLS_RESOLVED_KEY="$requested_key"
    TLS_RESOLVED_CERT="$requested_cert"
    return 0
  fi

  local live_key="/etc/letsencrypt/live/$ssl_domain/privkey.pem"
  local live_cert="/etc/letsencrypt/live/$ssl_domain/fullchain.pem"
  if sudo_test_file "$live_key" && sudo_test_file "$live_cert"; then
    TLS_RESOLVED_KEY="$live_key"
    TLS_RESOLVED_CERT="$live_cert"
    return 0
  fi

  local archive_key archive_cert
  archive_key=$(run_sudo bash -lc 'find "/etc/letsencrypt/archive/'"$ssl_domain"'" -maxdepth 1 -type f -name "privkey*.pem" 2>/dev/null | sort | head -n 1' || true)
  archive_cert=$(run_sudo bash -lc 'find "/etc/letsencrypt/archive/'"$ssl_domain"'" -maxdepth 1 -type f -name "fullchain*.pem" 2>/dev/null | sort | head -n 1' || true)
  if [ -n "$archive_key" ] && [ -n "$archive_cert" ]; then
    TLS_RESOLVED_KEY="$archive_key"
    TLS_RESOLVED_CERT="$archive_cert"
    return 0
  fi

  return 1
}

copy_tls_files_for_release() {
  local src_key="$1"
  local src_cert="$2"
  local src_ca="$3"
  local target_dir="$4"

  mkdir -p "$target_dir"
  log "Copying TLS files into release-local path: $target_dir"
  log "Source TLS files: key=$src_key cert=$src_cert ca=$src_ca"

  if ! run_sudo cp "$src_key" "$target_dir/privkey.pem"; then
    log "Primary sudo cp failed for key $src_key"
    if ! run_sudo bash -lc "cat \"$src_key\" > \"$target_dir/privkey.pem\""; then
      log "Fallback sudo cat failed for key $src_key"
      return 1
    fi
  fi

  if ! run_sudo cp "$src_cert" "$target_dir/fullchain.pem"; then
    log "Primary sudo cp failed for cert $src_cert"
    if ! run_sudo bash -lc "cat \"$src_cert\" > \"$target_dir/fullchain.pem\""; then
      log "Fallback sudo cat failed for cert $src_cert"
      return 1
    fi
  fi

  if [ -n "$src_ca" ] && sudo_test_file "$src_ca"; then
    if ! run_sudo cp "$src_ca" "$target_dir/chain.pem"; then
      log "Warning: failed to copy CA file $src_ca; continuing without chain.pem"
      rm -f "$target_dir/chain.pem" >/dev/null 2>&1 || true
    fi
  else
    log "No readable CA source file found at $src_ca; skipping chain.pem copy"
  fi

  run_sudo chown "$(whoami):$(id -gn)" "$target_dir"/*.pem >/dev/null 2>&1 || true
  chmod 600 "$target_dir/privkey.pem" >/dev/null 2>&1 || true
  chmod 644 "$target_dir/fullchain.pem" >/dev/null 2>&1 || true
  if [ -f "$target_dir/chain.pem" ]; then
    chmod 644 "$target_dir/chain.pem" >/dev/null 2>&1 || true
  fi
  return 0
}

copy_tls_if_unreadable() {
  local source_key="$1"
  local source_cert="$2"
  local source_ca="$3"
  local release_dir="$4"
  local ssl_copy_dir="$release_dir/ssl"

  if [ -r "$source_key" ] && [ -r "$source_cert" ]; then
    log "TLS files are already readable by the current user"
    return 0
  fi

  log "TLS files are not readable by the current user: key=$source_key cert=$source_cert"
  if copy_tls_files_for_release "$source_key" "$source_cert" "$source_ca" "$ssl_copy_dir"; then
    SSL_KEY_PATH="$ssl_copy_dir/privkey.pem"
    SSL_CERT_PATH="$ssl_copy_dir/fullchain.pem"
    if [ -f "$ssl_copy_dir/chain.pem" ]; then
      SSL_CA_PATH="$ssl_copy_dir/chain.pem"
    else
      unset SSL_CA_PATH
      log "CA file not available in copied SSL dir; SSL_CA_PATH unset so HTTPS can still start with fullchain.pem"
    fi
    export SSL_KEY_PATH
    export SSL_CERT_PATH
    export SSL_CA_PATH
    log "Using copied TLS files in $ssl_copy_dir for release"
    if [ -r "$SSL_KEY_PATH" ] && [ -r "$SSL_CERT_PATH" ]; then
      log "Copied TLS files are readable: key=$SSL_KEY_PATH cert=$SSL_CERT_PATH"
      return 0
    fi
    log "Copied TLS files are present but still not readable: key=$SSL_KEY_PATH cert=$SSL_CERT_PATH"
    return 1
  fi

  if run_sudo test -r "$source_key" >/dev/null 2>&1 && run_sudo test -r "$source_cert" >/dev/null 2>&1; then
    log "TLS files are readable by sudo but copy failed unexpectedly"
  else
    log "TLS files are not readable even by sudo or are missing: $source_key, $source_cert"
  fi

  return 1
}

ensure_tls_prerequisites() {
  local app_dir="$1"
  local ssl_domain="${SSL_DOMAIN:-}"
  local ssl_email="${SSL_EMAIL:-}"
  local ssl_key_path="${SSL_KEY_PATH:-}"
  local ssl_cert_path="${SSL_CERT_PATH:-}"
  local ssl_ca_path="${SSL_CA_PATH:-}"

  log "Entering ensure_tls_prerequisites for $app_dir"
  if [ -f "$app_dir/.env.production" ]; then
    log "Loading TLS settings from $app_dir/.env.production"
    set -a
    # shellcheck source=/dev/null
    . "$app_dir/.env.production"
    set +a
    ssl_domain="${SSL_DOMAIN:-$ssl_domain}"
    ssl_email="${SSL_EMAIL:-$ssl_email}"
    ssl_key_path="${SSL_KEY_PATH:-$ssl_key_path}"
    ssl_cert_path="${SSL_CERT_PATH:-$ssl_cert_path}"
    ssl_ca_path="${SSL_CA_PATH:-$ssl_ca_path}"
  fi

  if [ -z "$ssl_domain" ]; then
    ssl_domain="delta-api.cerbon.id"
  fi
  if [ -z "$ssl_email" ]; then
    ssl_email="admin@$ssl_domain"
  fi
  if [ -z "$ssl_key_path" ]; then
    ssl_key_path="/etc/letsencrypt/live/$ssl_domain/privkey.pem"
  fi
  if [ -z "$ssl_cert_path" ]; then
    ssl_cert_path="/etc/letsencrypt/live/$ssl_domain/fullchain.pem"
  fi
  if [ -z "$ssl_ca_path" ]; then
    ssl_ca_path="/etc/letsencrypt/live/$ssl_domain/chain.pem"
  fi

  export SSL_DOMAIN="$ssl_domain"
  export SSL_EMAIL="$ssl_email"
  export SSL_KEY_PATH="$ssl_key_path"
  export SSL_CERT_PATH="$ssl_cert_path"
  export SSL_CA_PATH="$ssl_ca_path"

  if resolve_existing_tls_paths "$ssl_domain" "$ssl_key_path" "$ssl_cert_path"; then
    export SSL_KEY_PATH="$TLS_RESOLVED_KEY"
    export SSL_CERT_PATH="$TLS_RESOLVED_CERT"
    log "TLS certificate files already exist for $ssl_domain; initial resolved paths: key=$SSL_KEY_PATH cert=$SSL_CERT_PATH"

    # If the deploy user cannot read /etc/letsencrypt, copy certs into the staged release
    if ! copy_tls_if_unreadable "$SSL_KEY_PATH" "$SSL_CERT_PATH" "$ssl_ca_path" "$app_dir"; then
      log "Failed to make TLS files readable inside the release; aborting deployment"
      return 1
    fi

    log "Final TLS env for release: SSL_KEY_PATH=$SSL_KEY_PATH SSL_CERT_PATH=$SSL_CERT_PATH SSL_CA_PATH=$SSL_CA_PATH"
    log "Release local ssl dir exists: $( [ -d "$app_dir/ssl" ] && echo yes || echo no )"
    if [ -d "$app_dir/ssl" ]; then
      log "Release local ssl contents: $(ls -1 "$app_dir/ssl" 2>/dev/null | tr '\n' ',' | sed 's/,$//')"
    fi
    return 0
  fi

  if ! ensure_command certbot "install certbot for Let's Encrypt"; then
    log "certbot is required for TLS but could not be installed automatically; aborting"
    return 1
  fi

  log "Requesting Let's Encrypt certificate for $ssl_domain"
  local certbot_status=0
  if run_sudo certbot certonly --non-interactive --agree-tos --standalone --preferred-challenges http --email "$ssl_email" -d "$ssl_domain"; then
    certbot_status=0
  else
    certbot_status=$?
  fi

  if resolve_existing_tls_paths "$ssl_domain" "$ssl_key_path" "$ssl_cert_path"; then
    export SSL_KEY_PATH="$TLS_RESOLVED_KEY"
    export SSL_CERT_PATH="$TLS_RESOLVED_CERT"
    if [ "$certbot_status" -eq 0 ]; then
      log "TLS certificate provisioned successfully for $ssl_domain"
    else
      log "Certbot did not need to issue a new certificate; existing TLS files are available for $ssl_domain"
    fi

    if ! copy_tls_if_unreadable "$SSL_KEY_PATH" "$SSL_CERT_PATH" "$ssl_ca_path" "$app_dir"; then
      log "Failed to make TLS files readable inside the release after certificate issuance; aborting deployment"
      return 1
    fi

    log "Final TLS env for release: SSL_KEY_PATH=$SSL_KEY_PATH SSL_CERT_PATH=$SSL_CERT_PATH SSL_CA_PATH=$SSL_CA_PATH"
    log "Release local ssl dir exists: $( [ -d "$app_dir/ssl" ] && echo yes || echo no )"
    if [ -d "$app_dir/ssl" ]; then
      log "Release local ssl contents: $(ls -1 "$app_dir/ssl" 2>/dev/null | tr '\n' ',' | sed 's/,$//')"
    fi
    return 0
  fi

  if run_sudo certbot certificates 2>/dev/null | grep -q "$ssl_domain"; then
    export SSL_KEY_PATH="/etc/letsencrypt/live/$ssl_domain/privkey.pem"
    export SSL_CERT_PATH="/etc/letsencrypt/live/$ssl_domain/fullchain.pem"
    log "Certbot reports a certificate for $ssl_domain; continuing with the expected Certbot paths"

    if ! copy_tls_if_unreadable "$SSL_KEY_PATH" "$SSL_CERT_PATH" "$ssl_ca_path" "$app_dir"; then
      log "Failed to make TLS files readable inside the release using expected Certbot paths; aborting deployment"
      return 1
    fi

    log "Final TLS env for release: SSL_KEY_PATH=$SSL_KEY_PATH SSL_CERT_PATH=$SSL_CERT_PATH SSL_CA_PATH=$SSL_CA_PATH"
    log "Release local ssl dir exists: $( [ -d "$app_dir/ssl" ] && echo yes || echo no )"
    if [ -d "$app_dir/ssl" ]; then
      log "Release local ssl contents: $(ls -1 "$app_dir/ssl" 2>/dev/null | tr '\n' ',' | sed 's/,$//')"
    fi
    return 0
  fi

  if [ "$certbot_status" -ne 0 ]; then
    log "Failed to obtain Let's Encrypt certificate for $ssl_domain"
    return 1
  fi

  log "Let's Encrypt certificate issuance completed but expected files were not created"
  if [ -d "/etc/letsencrypt/live/$ssl_domain" ]; then
    ls -la "/etc/letsencrypt/live/$ssl_domain" 2>/dev/null || true
  fi
  return 1
}

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
run_sudo() {
  # Run command with sudo if needed. Supports non-interactive password via
  # SUDO_PASSWORD environment variable (will be used via stdin).
  if command -v sudo >/dev/null 2>&1; then
    # passwordless sudo
    if sudo -n true >/dev/null 2>&1; then
      sudo "$@"
      return $?
    fi
    # use provided password non-interactively
    if [ -n "${SUDO_PASSWORD:-}" ]; then
      printf '%s\n' "$SUDO_PASSWORD" | sudo -S "$@"
      return $?
    fi
    log "sudo is installed but no passwordless sudo and no SUDO_PASSWORD were provided"
    return 2
  fi
  # if no sudo, ensure we are root
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
    return $?
  fi
  log "sudo is required but not installed and the current user is not root"
  return 2
}

ensure_command() {
  local cmd="${1:-}"
  local hint="${2:-}"
  if [ -z "$cmd" ]; then
    log "ensure_command called without a command name"
    return 1
  fi
  if command -v "$cmd" >/dev/null 2>&1; then
    return 0
  fi
  log "Command '$cmd' not found; attempting automated install"

  case "$cmd" in
    node|npm)
      resolve_node_version
      if ! command -v curl >/dev/null 2>&1; then
        log "curl not found; installing curl first"
        if ! run_sudo apt-get update -qq || ! run_sudo apt-get install -y -qq curl; then
          log "Failed to install curl"
          return 1
        fi
      fi
      # download NodeSource setup script and run it with sudo if needed
      tmp_script="/tmp/nodesource_setup_${NODE_INSTALL_VERSION}.sh"
      if ! curl -fsSL "https://deb.nodesource.com/setup_${NODE_INSTALL_VERSION}.x" -o "$tmp_script"; then
        log "Failed to download NodeSource setup script"
      else
        if ! run_sudo bash "$tmp_script"; then
          log "NodeSource setup failed; falling back to apt packages"
        fi
        rm -f "$tmp_script" || true
      fi
      if ! run_sudo apt-get update -qq || ! run_sudo apt-get install -y -qq nodejs; then
        log "Failed to install nodejs from apt"
        return 1
      fi
      ;;
    pm2)
      ensure_command npm || return 1
      log "Installing pm2 globally via npm"
      if ! run_sudo npm install -g pm2 --silent; then
        log "Global npm install of pm2 failed; trying without sudo"
        if ! npm install -g pm2 --silent; then
          log "Failed to install pm2"
          return 1
        fi
      fi
      ;;
    curl)
      if ! run_sudo apt-get update -qq || ! run_sudo apt-get install -y -qq curl; then
        log "Failed to install curl"
        return 1
      fi
      ;;
    certbot)
      if ! run_sudo apt-get update -qq || ! run_sudo apt-get install -y -qq certbot; then
        log "Failed to install certbot"
        return 1
      fi
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

ensure_swap_space() {
  local desired_swap_mb=${SWAP_SIZE_MB:-2048}
  local swap_file=${SWAP_FILE:-/swapfile}
  local current_swap
  current_swap=$(free -m | awk '/^Swap:/ {print $2}')

  log "Memory status: $(free -m | awk 'NR<=2 {print $0}' | tr '\n' ' | ')"
  log "Swap available: ${current_swap:-0} MiB, desired: ${desired_swap_mb} MiB"

  if [ -n "$current_swap" ] && [ "$current_swap" -ge "$desired_swap_mb" ]; then
    log "Existing swap is sufficient"
    return 0
  fi

  if [ "$(id -u)" -ne 0 ] && ! command -v sudo >/dev/null 2>&1; then
    log "Cannot create swap: not root and sudo is unavailable"
    return 0
  fi

  local avail_mb
  avail_mb=$(df --output=avail -m / | tail -n1 | tr -d ' ')
  if [ -z "$avail_mb" ] || [ "$avail_mb" -lt "$desired_swap_mb" ]; then
    log "Insufficient disk space for swap creation: available ${avail_mb:-0} MiB, needed ${desired_swap_mb} MiB"
    return 0
  fi

  if [ -f "$swap_file" ]; then
    log "Existing swap file detected at $swap_file"
  else
    log "Creating swap file $swap_file (${desired_swap_mb} MiB)"
    if command -v fallocate >/dev/null 2>&1; then
      run_sudo fallocate -l "${desired_swap_mb}M" "$swap_file" || run_sudo dd if=/dev/zero of="$swap_file" bs=1M count="$desired_swap_mb" status=none
    else
      run_sudo dd if=/dev/zero of="$swap_file" bs=1M count="$desired_swap_mb" status=none
    fi
    run_sudo chmod 600 "$swap_file"
    run_sudo mkswap "$swap_file"
  fi

  if ! run_sudo swapon "$swap_file" >/dev/null 2>&1; then
    log "Failed to activate swapfile $swap_file"
    return 0
  fi

  current_swap=$(free -m | awk '/^Swap:/ {print $2}')
  log "Swap activated: ${current_swap:-0} MiB available"
  return 0
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

database_has_tables() {
  local app_dir="$1"
  local output
  local code

  if [ ! -f "$app_dir/scripts/check-db-empty.js" ]; then
    log "Database table check helper not found at $app_dir/scripts/check-db-empty.js"
    return 2
  fi

  set +e
  output=$(cd "$app_dir" && node scripts/check-db-empty.js 2>&1)
  code=$?
  set -e

  if [ "$code" -eq 0 ]; then
    log "Database is empty (no tables found)."
    return 1
  fi
  if [ "$code" -eq 1 ]; then
    log "Database already contains tables."
    return 0
  fi

  log "Database table check failed with code $code: $output"
  return 2
}

live_deployment_should_verify() {
  local app_dir="$1"
  if database_has_tables "$app_dir"; then
    log "Live database already contains tables; verifying promoted release with health checks"
    return 0
  fi

  local status=$?
  if [ "$status" -eq 2 ]; then
    log "Live database state could not be determined; defaulting to verification and health check"
    return 0
  fi

  log "Live database is empty; skipping final health verification to allow initial seed to complete"
  return 1
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
  local want_https=0
  local https_ok=0
  local http_ok=0

  if [[ "$url" == https://* ]]; then
    want_https=1
  fi

  log "Checking health endpoint $url"
  for i in $(seq 1 $retries); do
    https_ok=0
    http_ok=0

    if [[ "$url" == https://* ]]; then
      local curl_args=(curl -sS --fail --max-time 5 --insecure)
      if "${curl_args[@]}" "$url" | grep -q '"status".*"ok"'; then
        log "Health endpoint reports OK at $url"
        return 0
      fi
      log "HTTPS check failed for $url"
      http_ok=0
      local fallback_url="${url/https:/http:}"
      if curl -sS --fail --max-time 5 "$fallback_url" | grep -q '"status".*"ok"'; then
        http_ok=1
      fi
    else
      if curl -sS --fail --max-time 5 "$url" | grep -q '"status".*"ok"'; then
        log "Health endpoint reports OK at $url"
        return 0
      fi
    fi

    if [[ "$want_https" -eq 1 && "$http_ok" -eq 1 ]]; then
      log "HTTPS health check failed but HTTP succeeded for $url; deployment requires HTTPS"
      return 1
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

  log "Ensuring Node.js and PM2 are available on the target host"
  if ! ensure_command npm "install nodejs/npm (requires sudo)"; then
    log "npm is required but could not be installed automatically; aborting"
    exit 1
  fi
  if ! ensure_command pm2 "install pm2 globally via npm"; then
    log "pm2 is required but could not be installed automatically; aborting"
    exit 1
  fi

  ensure_swap_space || log "Swap creation step exited with warnings; continuing deployment"

  if should_skip_remote_build "$release_tmp"; then
    log "Skipping remote npm ci/build because deployment artifacts already include dist and node_modules"
  else
    log "Installing dependencies and building in temporary release"
    cd "$release_tmp"
    npm ci
    npm run build
  fi

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

  ensure_tls_prerequisites "$release_tmp"
  log "Staged release TLS env: SSL_KEY_PATH=$SSL_KEY_PATH SSL_CERT_PATH=$SSL_CERT_PATH SSL_CA_PATH=$SSL_CA_PATH"
  if [ -f "$release_tmp/ssl/privkey.pem" ]; then
    log "Staged release local copied TLS files are present: $release_tmp/ssl"
  fi
  ensure_database_prerequisites "$release_tmp"

  # Run the staged release directly on a test port so it doesn't conflict with the live process
  local test_port
  test_port=$((PORT + 1))
  local candidate_log="$release_tmp/candidate.log"
  log "Starting staged release for verification on port $test_port with SKIP_PRISMA_SEED=true (logs: $candidate_log)"
  # start node directly so PM2 isn't disturbed; redirect output to candidate log
  SKIP_PRISMA_SEED=1 NODE_ENV=production PORT="$test_port" node "$release_tmp/dist/index.js" > "$candidate_log" 2>&1 &
  local candidate_pid=$!

  # Wait for the staged release to prove the database is reachable before treating it as valid
  local verified=1
  if wait_for_database_verification "$release_tmp"; then
    if check_health_for_url "https://127.0.0.1:${test_port}/api/health"; then
      log "Staged release verified DB connection and health endpoint"
      verified=0
    else
      log "Health endpoint did not respond yet; inspecting candidate log"
      if [ -f "$candidate_log" ]; then
        tail -n 50 "$candidate_log" || true
      fi
    fi
  fi

  # Tear down candidate process
  if ps -p "$candidate_pid" > /dev/null 2>&1; then
    log "Stopping staged release (pid $candidate_pid)"
    kill "$candidate_pid" || true
    # give it a moment
    sleep 1
  fi

  if [ "$verified" -eq 0 ]; then
    log "Candidate release started successfully"
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

  log "Ensuring TLS prerequisites for promoted release at $DEPLOY_DIR"
  ensure_tls_prerequisites "$DEPLOY_DIR" || {
    log "Failed to resolve TLS paths for the promoted release"
    restore_previous_release "$backup" || true
    exit 1
  }
  log "Promoted release TLS env: SSL_KEY_PATH=$SSL_KEY_PATH SSL_CERT_PATH=$SSL_CERT_PATH SSL_CA_PATH=$SSL_CA_PATH"
  if [ -f "$DEPLOY_DIR/ssl/privkey.pem" ]; then
    log "Promoted release local copied TLS files are present: $DEPLOY_DIR/ssl"
  fi

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

  if live_deployment_should_verify "$DEPLOY_DIR"; then
    if ! check_health; then
      log "Health check failed for PM2-managed process"
      log "Attempting to restore previous release"
      restore_previous_release "$backup" || true
      exit 1
    fi
  else
    log "Health check skipped for promoted release because live database is empty and initial seed is still expected to run"
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
