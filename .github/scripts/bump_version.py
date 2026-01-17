#!/usr/bin/env python3
import json
import sys
import os
import re
import tomllib


def update_json_file(file_path, new_version, mode, key=None):
    """Update version in a JSON file"""
    try:
        with open(file_path, "r") as f:
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
            data[new_version] = "1.8.0"  # TODO: Make this dynamic

    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)


def update_file_versions(new_version, config_path):
    """Update version in all configured files"""
    try:
        with open(config_path, "rb") as f:
            config = tomllib.load(f)
    except FileNotFoundError:
        print(f"Error: {config_path} not found")
        sys.exit(1)

    # Process each release configuration
    for release_type, files in config.get("releases", {}).items():
        print(f"Processing {release_type} release updates...")
        for file_config in files:
            file_path = file_config["file"]
            mode = file_config.get("mode", "replace")
            key = file_config.get("key", "version")

            if not os.path.exists(file_path):
                print(f"Warning: {file_path} not found, skipping...")
                continue

            update_json_file(file_path, new_version, mode, key)


def main():
    if len(sys.argv) != 2:
        print("Usage: bump_version.py <version>")
        sys.exit(1)

    new_version = sys.argv[1]

    # Validate version format
    if not re.match(r"^\d+\.\d+\.\d+$", new_version):
        print(f"Error: Invalid version format: {new_version}")
        sys.exit(1)

    # Update all files with new version
    update_file_versions(new_version, "semver-config.toml")
    print(f"Updated version to {new_version}")


if __name__ == "__main__":
    main()
