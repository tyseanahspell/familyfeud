#!/usr/bin/env bash
# Deploy Family Feud on Ubuntu using Docker Compose.
# Installs Docker Engine + Compose plugin if missing, then builds and starts the app.
set -euo pipefail

APP_NAME="familyfeud"
COMPOSE_FILE="docker-compose.yml"
DEFAULT_PORT=8080

log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

require_root_or_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    SUDO=""
  elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    die "This script needs root privileges or sudo to install Docker."
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

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    $SUDO docker "$@"
  fi
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    docker compose "$@"
  else
    $SUDO docker compose "$@"
  fi
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

[[ -f "${COMPOSE_FILE}" ]] || die "Missing ${COMPOSE_FILE} in ${SCRIPT_DIR}"
[[ -f Dockerfile ]] || die "Missing Dockerfile in ${SCRIPT_DIR}"

PORT="${PORT:-$DEFAULT_PORT}"
export PORT

require_root_or_sudo
detect_ubuntu
install_docker

log "Building and starting ${APP_NAME} on port ${PORT}..."
compose_cmd up -d --build

log "Waiting for health check..."
health_ok=0
for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1 \
    || wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    health_ok=1
    break
  fi
  sleep 2
done

if [[ "${health_ok}" -eq 1 ]]; then
  HOST_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  log "Family Feud is up: http://${HOST_IP:-localhost}:${PORT}"
  compose_cmd ps
  exit 0
fi

log "Container started but health check did not pass yet. Check logs:"
echo "  docker compose logs -f"
compose_cmd ps
exit 1
