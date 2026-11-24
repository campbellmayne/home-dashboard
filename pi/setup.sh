#!/usr/bin/env bash
# Turns a fresh Raspberry Pi OS (Bookworm or later, Desktop, 64-bit) into a wall dashboard kiosk.
# Run as the normal desktop user from the repo root:  bash pi/setup.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8080

echo "==> Timezone and locale"
sudo timedatectl set-timezone Australia/Melbourne

echo "==> Packages (Chromium, on-screen keyboard)"
sudo apt-get update
sudo apt-get install -y squeekboard
sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium

echo "==> Dashboard web server (systemd, port $PORT)"
sudo tee /etc/systemd/system/home-dashboard.service >/dev/null <<EOF
[Unit]
Description=Home dashboard static server
After=network.target

[Service]
User=$USER
WorkingDirectory=$REPO/dashboard
ExecStart=/usr/bin/python3 -m http.server $PORT --bind 127.0.0.1
Restart=always

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now home-dashboard

echo "==> Kiosk autostart (labwc Wayland session)"
CHROME=$(command -v chromium-browser || command -v chromium)
mkdir -p ~/.config/labwc
AUTOSTART=~/.config/labwc/autostart
touch "$AUTOSTART"
grep -q home-dashboard "$AUTOSTART" || cat >>"$AUTOSTART" <<EOF
# home-dashboard kiosk
$CHROME --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble \\
  --overscroll-history-navigation=0 --disable-pinch --check-for-update-interval=31536000 \\
  --autoplay-policy=no-user-gesture-required --ozone-platform=wayland \\
  http://localhost:$PORT/ &
EOF

echo "==> Disable screen blanking (the dashboard dims itself at night)"
sudo raspi-config nonint do_blanking 1 || true

echo "Done. Reboot to start the kiosk:  sudo reboot"
