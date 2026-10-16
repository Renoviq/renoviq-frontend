#!/usr/bin/env bash
# Uploads dist/ to the server as a new release and points nginx at it (the "current" link).
# Needs EC2_USER, EC2_HOST and SHA. Optional: WEB_ROOT (default /var/www/renoviq), SSH_CMD.
# The last 3 releases are kept, so going back is: ln -sfn releases/<older> /var/www/renoviq/current
set -euo pipefail
: "${EC2_USER:?}" "${EC2_HOST:?}" "${SHA:?}"
WEB_ROOT="${WEB_ROOT:-/var/www/renoviq}"
SSH_CMD="${SSH_CMD:-ssh -i $HOME/.ssh/deploy_key -o BatchMode=yes -o StrictHostKeyChecking=yes}"
REL="$WEB_ROOT/releases/$SHA"
TARGET="$EC2_USER@$EC2_HOST"

[ -s dist/index.html ] || { echo "dist/ is empty: run npm run build first" >&2; exit 1; }

# SSH_CMD is a command plus options, so it is deliberately not quoted.
# shellcheck disable=SC2086
{
  $SSH_CMD "$TARGET" "rm -rf '$REL' && mkdir -p '$REL'"
  tar -czf - -C dist . | $SSH_CMD "$TARGET" "tar -xzf - -C '$REL'"
  # ln + mv -T swaps the link in one step, so visitors never see a missing site.
  # touch: tar keeps the build's old timestamp, and the cleanup sorts releases by it.
  # The release just activated is never deleted; it plus the 2 newest others are kept.
  $SSH_CMD "$TARGET" "test -s '$REL/index.html' && touch '$REL' && ln -sfn '$REL' '$WEB_ROOT/current.new' && mv -Tf '$WEB_ROOT/current.new' '$WEB_ROOT/current' && cd '$WEB_ROOT/releases' && ls -1t | grep -vxF '$SHA' | tail -n +3 | xargs -r rm -rf --"
}
echo "Released $SHA"
