#!/usr/bin/env bash
source $(dirname $0)/functions.sh

GRAY='\033[1;30m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

version=$1

if [[ -z $version ]]; then
    version='latest'
else
    if ! isValidVersionNumber ${version}; then
        exit 1
    fi
fi

read -p "Entrypoint IP (v4): " host
until isValidIpv4 ${host}; do
    read -p "Entrypoint IP (v4): " host
done

echo -e "${GREEN}\n$(date +"%Y-%m-%d %H:%M:%S"): Deploying the ${version} version to production\n${NC}"

ssh -t ngranko@$host "
    set -e

    `typeset -f updateImage`
    `typeset -f maybeTagLatest`

    cd /var/docker/radioatelier-web

    echo -e \"Pulling docker images from the registry\"
    updateImage registry.radioatelier.one/radioatelier-web/app ${version}

    echo -e \"Creating new containers\"
    docker compose up -d

    echo -e \"Removing dangling docker images\"
    docker image prune -af
" || exit 1

echo -e "${GREEN}\n$(date +"%Y-%m-%d %H:%M:%S"): Deploy successful\n${NC}"
