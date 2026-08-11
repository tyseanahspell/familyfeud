#!/usr/bin/env bash
# Deploy Family Feud on Ubuntu using Docker Compose.
# Installs Docker Engine + Compose plugin if missing, then builds and starts the app.
#
# Usage:
#   sudo ./deploy.sh
#   sudo FAMILYFEUD_PORT=80 ./deploy.sh
#   sudo ./deploy.sh --down
#

set -euo pipefail

APP_NAME="familyfeud"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${APP_DIR}/docker-compose.yml"
FAMILYFEUD_PORT="${FAMILYFEUD_PORT:-80}"

log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

require_root() {
  if [[ "${EUID}" -eq 0 ]]; then
    die "This script must be run as root (use sudo)." >&2
  fi
}

detect_ubuntu() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    [[ "${ID:-}" == "ubuntu" ]] || log "Warning: non-Ubuntu detected (${ID:-unknown}). Continuing anyway."
  fi
}

install_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log "Docker and Compose already installed."
    docker --version
    docker compose version
    return
  fi

  log "Installing Docker Engine and Compose plugin..."
  $SUDO apt-get update -y
  $SUDO apt-get install -y ca-certificates curl gnupg lsb-release

  $SUDO install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
      | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
  fi

  # shellcheck disable=SC1091
  . /etc/os-release
  local arch codename
  arch="$(dpkg --print-architecture)"
  codename="${VERSION_CODENAME:-$(lsb_release -cs)}"

  echo \
    "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${codename} stable" \
    | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null

  $SUDO apt-get update -y
  $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  $SUDO systemctl enable --now docker

  # Allow current user to run docker without sudo (effective after re-login)
  if [[ -n "${SUDO_USER:-}" ]]; then
    $SUDO usermod -aG docker "${SUDO_USER}"
    log "Added ${SUDO_USER} to the docker group (log out/in for it to take effect)."
  elif [[ "${EUID}" -ne 0 && -n "${USER:-}" ]]; then
    $SUDO usermod -aG docker "${USER}"
    log "Added ${USER} to the docker group (log out/in for it to take effect)."
  fi

  log "Docker installation complete."
  docker --version || $SUDO docker --version
  docker compose version || $SUDO docker compose version
}

compose_cmd() {
  FAMILYFEUD_PORT="${FAMILYFEUD_PORT}" docker compose -f "${COMPOSE_FILE}" "$@"
}

deploy_app() {
  log "Building and starting ${APP_NAME} on port ${FAMILYFEUD_PORT}..."
  cd "${APP_DIR}"
  compose_cmd up -d --build

  log "Waiting for health check..."
  health_ok=0
  for i in {1..30}; do
    if curl -fsS "http://127.0.0.1:${FAMILYFEUD_PORT}/health" >/dev/null 2>&1 \
      || wget -qO- "http://127.0.0.1:${FAMILYFEUD_PORT}/health" >/dev/null 2>&1; then
      health_ok=1
      break
    fi
    sleep 2
  done

  if [[ "${health_ok}" -eq 1 ]]; then
    HOST_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
    log "Family Feud is up: http://${HOST_IP:-localhost}:${FAMILYFEUD_PORT}"
    compose_cmd ps
    exit 0
  fi

  log "Service did not become healthy in time. Recent logs:"
  compose_cmd logs --tail=80
  exit 1
}

teardown() {
  log "Stopping Family Feud..."
  cd "${APP_DIR}"
  compose_cmd down
  log "Stopped."
}

main() {
  [[ -f "${COMPOSE_FILE}" ]] || die "Missing ${COMPOSE_FILE} in ${APP_DIR}"
  [[ -f Dockerfile ]] || die "Missing Dockerfile in ${APP_DIR}"

  require_root
  detect_ubuntu

  case "${1:-}" in
    --down)
      install_docker
      teardown
      ;;
    ""|--up)
      install_docker
      deploy_app
      ;;
    *)
      echo "Usage: sudo $0 [--up|--down]" >&2
      echo "Optional env: FAMILYFEUD_PORT=80" >&2
      exit 1
      ;;
  esac
}

main "$@"
