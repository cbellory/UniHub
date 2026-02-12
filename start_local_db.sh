#!/bin/bash
echo "Starting Local MongoDB..."
/usr/bin/mongod --dbpath /home/orangepi/site_deeplom/admin/data/db --port 27018 --bind_ip 127.0.0.1 --logpath /home/orangepi/site_deeplom/admin/logs/mongodb.log --fork
