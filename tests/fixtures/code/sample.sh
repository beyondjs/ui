#!/usr/bin/env bash
# Build and pack the package
set -euo pipefail
export TARGET="${HOME}/packs"
NAME=ui
if [ -d "$TARGET/$NAME" ]; then
	echo 'already there' --done
else
	for file in dist/*.css; do cp "$file" "$TARGET"; done
fi
exit 0 # done
