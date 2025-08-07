#!/usr/bin/env python3
import json
import sys
import os
import re
import tomllib

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

def update_json_file(file_path, new_version, mode, key=None):
    """Update version in a JSON file"""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Warning: {file_path} not found, skipping...")
        return
    except json.JSONDecodeError:
        print(f"Warning: {file_path} is not valid JSON, skipping...")
        return

    if mode == "replace" and key:
        if key in data:
            data[key] = new_version
        else:
            print(f"Warning: key '{key}' not found in {file_path}")
    elif mode == "append":
        # For versions.json, we update both the latest version and append to the list
        if file_path.endswith("versions.json"):
            data["latest"] = new_version
            if "versions" not in data:
                data["versions"] = []
            if new_version not in data["versions"]:
                data["versions"].append(new_version)

    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4)

def update_file_versions(new_version, config_path):
    """Update version in all configured files"""
    try:
        with open(config_path, 'rb') as f:
            config = tomllib.load(f)
    except FileNotFoundError:
        print(f"Error: {config_path} not found")
        sys.exit(1)

    # Process each release configuration
    for release_type, files in config.get('releases', {}).items():
        print(f"Processing {release_type} release updates...")
        for file_config in files:
            file_path = file_config['file']
            mode = file_config.get('mode', 'replace')
            key = file_config.get('key', 'version')

            if not os.path.exists(file_path):
                print(f"Warning: {file_path} not found, skipping...")
                continue

            update_json_file(file_path, new_version, mode, key)

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
