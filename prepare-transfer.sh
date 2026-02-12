#!/bin/bash

echo "🚀 Preparing project for transfer..."

# 1. Clean Backend
echo "🧹 Cleaning Backend..."
rm -rf backend/node_modules
rm -rf backend/logs
rm -f backend/*.log
rm -f backend/pm2-*.log

# 2. Clean Frontend
echo "🧹 Cleaning Frontend..."
rm -rf frontend/node_modules
rm -rf frontend/build
rm -f frontend/*.log

# 3. Clean Root
echo "🧹 Cleaning Root..."
rm -rf node_modules
rm -f *.log

# 4. Remove temporary backups if any (optional, keep main backups)
# echo "🧹 Cleaning Backups..."
# rm -rf backups/project/temp_*

echo "✅ Cleanup complete!"
echo "Now you can archive the project: tar -czf site_deeplom_transfer.tar.gz ."
