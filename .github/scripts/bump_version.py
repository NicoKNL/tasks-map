#!/usr/bin/env python3
import json
import sys
import os
import re
import toml
from pathlib import Path

def get_latest_version():
    """Get the latest version from the tags"""
    try:
        with open('versions.json', 'r') as f:
            versions = json.load(f)
            return versions.get('latest', '0.0.0')
    except FileNotFoundError:
        return '0.0.0'

def bump_version(current_version, bump_type):
    """Bump the version according to semver rules"""
    major, minor, patch = map(int, current_version.split('.'))

    if bump_type == 'major':
        return f"{major + 1}.0.0"
    elif bump_type == 'minor':
        return f"{major}.{minor + 1}.0"
    elif bump_type == 'patch':
        return f"{major}.{minor}.{patch + 1}"
    else:
        return current_version

def update_file_versions(new_version, config_path):
    """Update version in all configured files"""
    try:
        config = toml.load(config_path)
    except FileNotFoundError:
        print(f"Error: {config_path} not found")
        sys.exit(1)

    files_to_update = config.get('files_to_update', [])
    version_pattern = config.get('version_pattern', r'\d+\.\d+\.\d+')

    for file_path in files_to_update:
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} not found, skipping...")
            continue

        with open(file_path, 'r') as f:
            content = f.read()

        updated_content = re.sub(version_pattern, new_version, content)

        with open(file_path, 'w') as f:
            f.write(updated_content)

def main():
    if len(sys.argv) != 2:
        print("Usage: bump_version.py <bump_type>")
        sys.exit(1)

    bump_type = sys.argv[1]
    if bump_type not in ['major', 'minor', 'patch', 'noimpact']:
        print("Error: bump_type must be one of: major, minor, patch, noimpact")
        sys.exit(1)

    if bump_type == 'noimpact':
        print("No version bump required")
        sys.exit(0)

    current_version = get_latest_version()
    new_version = bump_version(current_version, bump_type)

    # Update all files with new version
    update_file_versions(new_version, 'semver-config.toml')
    print(new_version)

if __name__ == "__main__":
    main()
