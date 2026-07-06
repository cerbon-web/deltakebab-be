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
HEALTH_URL=${HEALTH_URL:-https://dapi.cerbon.id:${PORT}/api/health}

timestamp() { date -u +"%Y%m%dT%H%M%SZ"; }
log() { echo "[$(timestamp)] $*"; }

mkdir -p "$BACKUP_ROOT"

# Rotate backups: keep latest $KEEP_BACKUPS
rotate_backups() {
  local keep="$KEEP_BACKUPS"
  log "Rotating backups, keeping latest $keep"
  ls -1dt "$BACKUP_ROOT"/* 2>/dev/null | tail -n +$((keep+1)) | xargs -r rm -rf
}

# Create backup of current app
create_backup() {
  local bdir="$BACKUP_ROOT/$(timestamp)"
  log "Creating backup $bdir"
  mkdir -p "$bdir"
  rsync -a --delete "$DEPLOY_DIR/" "$bdir/"
  echo "$bdir"
}

# Restore backup
restore_backup() {
  local bdir="$1"
  log "Restoring backup from $bdir"
  rm -rf "$DEPLOY_DIR.old" || true
  mv "$DEPLOY_DIR" "$DEPLOY_DIR.old" || true
  mv "$bdir" "$DEPLOY_DIR"
  log "Restarting PM2 with restored version"
  NODE_ENV=production pm2 restart "$PM2_NAME" --update-env || NODE_ENV=production pm2 start "$DEPLOY_DIR/dist/index.js" --name "$PM2_NAME" --update-env
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

# Wait for application startup log indicating DB verified
wait_for_db_verified() {
  local retries=30
  local delay=2
  # pm2 logs are usually available via pm2 logs <name> --lines 100
  log "Waiting for database verification in PM2 logs (up to $((retries*delay))s)"
  for i in $(seq 1 $retries); do
    if pm2 logs "$PM2_NAME" --lines 200 | grep -q "Database connection verified"; then
      log "Database connection verified by application logs"
      return 0
    fi
    sleep $delay
  done
  return 1
}

# Health check
check_health() {
  local retries=30
  local delay=2
  log "Checking health endpoint $HEALTH_URL"
  for i in $(seq 1 $retries); do
    if curl -sS --fail --max-time 5 "$HEALTH_URL" | grep -q '"status".*"ok"'; then
      log "Health endpoint reports OK"
      return 0
    fi
    log "Health check failed ($i/$retries), retrying in $delay seconds"
    sleep $delay
  done
  return 1
}

main() {
  rotate_backups
  local backup=$(create_backup)

  log "Uploading new release"
  rsync -az --delete "$ARTIFACT_DIR/" "$DEPLOY_DIR/"

  log "Installing dependencies and building"
  cd "$DEPLOY_DIR"
  npm ci
  npm run build

  log "Restarting PM2 with new release"
  NODE_ENV=production pm2 restart "$PM2_NAME" --update-env || NODE_ENV=production pm2 start "$DEPLOY_DIR/dist/index.js" --name "$PM2_NAME" --update-env

  if ! wait_for_pm2; then
    log "PM2 failed to start process"
    log "Rolling back to previous backup"
    restore_backup "$backup"
    exit 1
  fi

  if ! wait_for_db_verified; then
    log "Database verification failed"
    log "Rolling back to previous backup"
    restore_backup "$backup"
    exit 1
  fi

  if ! check_health; then
    log "Health check failed"
    log "Rolling back to previous backup"
    restore_backup "$backup"
    exit 1
  fi

  log "Deployment successful"
  exit 0
}

main "$@"
