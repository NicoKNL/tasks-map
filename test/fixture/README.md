# Test Fixture Vault

This Obsidian vault serves as a test environment for the Tasks Map plugin development.

## Setup

The plugin is loaded via a symbolic link in `.obsidian/plugins/tasks-map/` that points to the root project directory. This means:

1. Run `npm run build` in the project root to compile the latest plugin version
2. Open this fixture vault in Obsidian to test the latest built version
3. Any changes you make to the plugin code will be reflected after rebuilding and reloading Obsidian

## Dependencies

**Important:** This fixture includes a pinned version of the **Dataview** plugin for reliable testing purposes, it should be updated frequently. Not updating it is more of a developer risk than a user risk, as it doesn't get packaged in any way upon release.
