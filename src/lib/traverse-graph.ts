import { BaseTask } from "src/types/base-task";

export type TraversalMode = "match" | "upstream" | "downstream" | "both";

/**
 * Given a set of seed node IDs (e.g. from a search match), expand the set
 * by traversing the dependency graph in the specified direction.
 *
 * - "match": return only the seed IDs (no traversal)
 * - "upstream": also include transitive dependencies (parents via incomingLinks)
 * - "downstream": also include transitive dependents (children that depend on seeds)
 * - "both": combine upstream and downstream
 *
 * Only nodes present in `allowedIds` are included and traversed through.
 * Seed IDs not in `allowedIds` are excluded from the result.
 */
export function traverseGraph(
  seedIds: string[],
  tasks: BaseTask[],
  allowedIds: Set<string>,
  mode: TraversalMode
): string[] {
  if (mode === "match") {
    const seedSet = new Set(seedIds);
    return tasks
      .map((t) => t.id)
      .filter((id) => seedSet.has(id) && allowedIds.has(id));
  }

  const taskMap = new Map<string, BaseTask>();
  for (const task of tasks) {
    taskMap.set(task.id, task);
  }

  // Build reverse adjacency: parentId -> [childIds that depend on it]
  const downstreamMap = new Map<string, string[]>();
  for (const task of tasks) {
    for (const parentId of task.incomingLinks) {
      if (!downstreamMap.has(parentId)) {
        downstreamMap.set(parentId, []);
      }
      downstreamMap.get(parentId)!.push(task.id);
    }
  }

  const result = new Set<string>();

  const collectUpstream = (id: string, visited: Set<string>) => {
    if (visited.has(id)) return;
    visited.add(id);
    if (!allowedIds.has(id)) return;
    result.add(id);

    const task = taskMap.get(id);
    if (!task) return;
    for (const parentId of task.incomingLinks) {
      collectUpstream(parentId, visited);
    }
  };

  const collectDownstream = (id: string, visited: Set<string>) => {
    if (visited.has(id)) return;
    visited.add(id);
    if (!allowedIds.has(id)) return;
    result.add(id);

    const children = downstreamMap.get(id) ?? [];
    for (const childId of children) {
      collectDownstream(childId, visited);
    }
  };

  const validSeeds = seedIds.filter((id) => allowedIds.has(id));

  if (mode === "upstream" || mode === "both") {
    const visited = new Set<string>();
    for (const id of validSeeds) {
      collectUpstream(id, visited);
    }
  }

  if (mode === "downstream" || mode === "both") {
    const visited = new Set<string>();
    for (const id of validSeeds) {
      collectDownstream(id, visited);
    }
  }

  // For upstream/downstream-only modes, ensure seeds are always included
  for (const id of validSeeds) {
    result.add(id);
  }

  // Preserve stable ordering: follow the original task order
  const idOrder = tasks.map((t) => t.id);
  return idOrder.filter((id) => result.has(id));
}
