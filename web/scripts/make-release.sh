#!/usr/bin/env bash
source $(dirname $0)/functions.sh

GRAY='\033[1;30m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

CURRENT_BRANCH=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')

releaseBranch='main'
hasStashed=false

function isVersionNumberAllowed() {
    if [[ ${releaseBranch} != 'main' ]]; then
        if ! isReleaseCandidateRelease ${version}; then
            echo -e "${RED}Non-master branches can only produce rc-releases${NC}" >&2
            return 1
        fi
    fi
    return 0
}

function maybeStash() {
    oldsha=$(git rev-parse -q --verify refs/stash)
    git stash push -uq -m "make-release.sh on `date`"
    newsha=$(git rev-parse -q --verify refs/stash)
    if [[ ${oldsha} != ${newsha} ]]; then
        hasStashed=true
    fi
}

function cleanup() {
    echo -e "${GRAY}Reverting working copy to a previous state${NC}"
    if [[ ${CURRENT_BRANCH} != ${releaseBranch} ]]; then
        git checkout ${CURRENT_BRANCH}
    fi

    if ${hasStashed}; then
        git stash pop
    fi
}

function bail() {
    cleanup
    echo -e "${RED}Error${NC}" >&2
    exit 1
}

while getopts "b:" opt; do
    case ${opt} in
        b)
            releaseBranch=$OPTARG
            ;;
    esac
done

shift $((OPTIND-1))

if [[ -z $1 ]]; then
    echo -e "${GRAY}Usage: make-release.sh VERSION${NC}" >&2
    exit 1
fi

version=$1

if ! branch_exists ${releaseBranch} || ! isValidVersionNumber ${version} || ! isVersionNumberAllowed; then
    exit 1
fi

echo -e "${GREEN}$(date +"%Y-%m-%d %H:%M:%S"): making a new set of production images\n${NC}"


echo -e "${GRAY}Moving working copy to a release state${NC}"
maybeStash
git pull
if [[ ${CURRENT_BRANCH} != ${releaseBranch} ]]; then
    echo -e "${GRAY}Switching to branch ${releaseBranch}${NC}"
    git checkout ${releaseBranch} || bail
fi

echo -e "creating app image"
docker build --compress --file docker/app/Dockerfile --tag registry.radioatelier.one/radioatelier-web/app:${version} --target prod . || bail
if ! isReleaseCandidateRelease ${version}; then
    docker tag registry.radioatelier.one/radioatelier-web/app:${version} registry.radioatelier.one/radioatelier-web/app:latest
    docker push registry.radioatelier.one/radioatelier-web/app:latest || bail
fi
docker push registry.radioatelier.one/radioatelier-web/app:${version} || bail

if ! isReleaseCandidateRelease ${version}; then
    git tag v${version}
    git push --no-verify origin v${version}
fi

echo -e "${GRAY}cleaning up created images${NC}"
docker rmi registry.radioatelier.one/radioatelier-web/app:${version}
docker image prune -f

cleanup

echo -e "${GREEN}Success${NC}"
