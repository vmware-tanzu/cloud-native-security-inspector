#!/bin/bash
#golang version: 1.19.0+

set +e
set -o noglob

#
# Set Colors
#

bold=$(tput bold)
underline=$(tput sgr 0 1)
reset=$(tput sgr0)

red=$(tput setaf 1)
green=$(tput setaf 76)
white=$(tput setaf 7)
tan=$(tput setaf 202)
blue=$(tput setaf 25)

#
# Headers and Logging
#

underline() { printf "${underline}${bold}%s${reset}\n" "$@"
}
h1() { printf "\n${underline}${bold}${blue}%s${reset}\n" "$@"
}
h2() { printf "\n${underline}${bold}${white}%s${reset}\n" "$@"
}
debug() { printf "${white}%s${reset}\n" "$@"
}
info() { printf "${white}➜ %s${reset}\n" "$@"
}
success() { printf "${green}✔ %s${reset}\n" "$@"
}
error() { printf "${red}✖ %s${reset}\n" "$@"
}
warn() { printf "${tan}➜ %s${reset}\n" "$@"
}
bold() { printf "${bold}%s${reset}\n" "$@"
}
note() { printf "\n${underline}${bold}${blue}Note:${reset} ${blue}%s${reset}\n" "$@"
}

set -e

function check_golang {
  note "Checking golang..."
	if ! go version &> /dev/null
	then
		error "No golang package in your enviroment. You should use golang docker image build binary."
		exit 1
	fi

	# golang has been installed and check its version
	if [[ $(go version) =~ (([0-9]+)\.([0-9]+)([\.0-9]*)) ]]
	then
		golang_version=${BASH_REMATCH[1]}
		golang_version_part1=${BASH_REMATCH[2]}
		golang_version_part2=${BASH_REMATCH[3]}
        required_version="1.19"

		# the version of golang does not meet the requirement
        if [ "$(printf '%s\n' "$required_version" "$golang_version" | sort -V | head -n1)" = "$required_version" ]; then
			note "golang version: $golang_version"
        else
			note "golang version: $golang_version"
			error "Need to upgrade golang package to 1.19.0+ ."
			exit 1
        fi
	else
		warn "Failed to parse golang version."
		return
	fi
}

function check_kubectl {
  note "Checking kubectl..."
	if ! kubectl version &> /dev/null
	then
		error "No kubectl existed in your environment. You should install kubectl first."
		exit 1
	fi
}

function check_helm() {
    note "Checking helm..."
    if ! helm version &> /dev/null
    	then
    		error "No helm existed in your environment. You should install helm first."
    		exit 1
    	fi
}

function check_docker {
  note "Checking docker..."
	if ! docker --version &> /dev/null
	then
		error "Need to install docker first and run this script again."
		exit 1
	fi

	# docker has been installed and check its version
#	if [[ $(docker --version) =~ (([0-9]+)\.([0-9]+)([\.0-9]*)) ]]
#	then
#		docker_version=${BASH_REMATCH[1]}
#		docker_version_part1=${BASH_REMATCH[2]}
#		docker_version_part2=${BASH_REMATCH[3]}
#
#		note "docker version: $docker_version"
#		# the version of docker does not meet the requirement
#		if [ "$docker_version_part1" -lt 17 ] || ([ "$docker_version_part1" -eq 17 ] && [ "$docker_version_part2" -lt 6 ])
#		then
#			error "Need to upgrade docker package to 17.06.0+."
#			exit 1
#		fi
#	else
#		error "Failed to parse docker version."
#		exit 1
#	fi
}

