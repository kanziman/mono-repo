#!/usr/bin/env bash
# Run from projects/nsq/ (npm postinstall CWD)
set -e
NSQ="$(pwd)/node_modules"
MONO="$(pwd)/../../node_modules"

mkdir -p "$MONO"

for pkg in @radix-ui next-themes react-day-picker; do
  rm -f "$MONO/$pkg"
  ln -s "$NSQ/$pkg" "$MONO/$pkg"
done
echo "[setup-symlinks] mono-repo symlinks OK"
