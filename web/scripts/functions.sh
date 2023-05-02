#!/usr/bin/env bash

GRAY='\033[1;30m'
RED='\033[0;31m'
NC='\033[0m'

function isValidVersionNumber() {
    if [[ $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc[0-9]+)?$ ]]; then
      return 0
    fi
    echo -e "${RED}Incorrect version: ${1}. Version format: ${GRAY}X.X.X[-rcX]${NC}" >&2
    return 1
}

function isValidIpv4() {
    if [[ $1 =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]+)?$ ]]; then
      return 0
    fi
    echo -e "${RED}IPv4 format: ${GRAY}X.X.X.X[:X]${NC}" >&2
    return 1
}

function branch_exists() {
    if [[ -z $(git branch -a --list "origin/$1") ]]; then
        echo -e "${RED}Branch $1 does not exist${NC}" >&2
        return 1
    fi
    return 0
}

function isReleaseCandidateRelease() {
    if [[ $1 =~ -rc[0-9]+$ ]]; then
        return 0
    fi
    return 1
}

function updateImage() {
    imageName=$1
    currentVersion=$2
    docker pull $imageName:$currentVersion
    maybeTagLatest $imageName $currentVersion
}

function maybeTagLatest() {
    imageName=$1
    currentVersion=$2
    if [[ $currentVersion != 'latest' ]]; then
        imageId=`docker images | sed -n "\|${imageName}|s| \+| |gp" | grep -w $currentVersion | cut -d ' ' -f3`
        docker tag ${imageId} ${imageName}:latest
    fi
}
