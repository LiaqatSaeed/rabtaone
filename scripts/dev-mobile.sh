#!/bin/bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH"
cd "$(dirname "$0")/../apps/mobile-app"
exec node_modules/.bin/next dev -p 3001
