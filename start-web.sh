#!/bin/bash
cd /opt/yzschros/apps/web/.next/standalone
export NODE_ENV=production
export PORT=3000
exec node apps/web/server.js
