import { traverseGraph, TraversalMode } from "../src/lib/traverse-graph";
import { NoteTask } from "../src/types/note-task";

function makeTask(
  id: string,
  incomingLinks: string[] = [],
  tags: string[] = []
): NoteTask {
  return new NoteTask({
    id,
    summary: id,
    text: "",
    tags,
    status: "todo",
    priority: "",
    link: `tasks/${id}.md`,
    incomingLinks,
    starred: false,
  });
}

/**
 * Test graph (edges point from dependency → dependent):
 *
 *   A → B → D → F
 *   A → C → E
 *         ↘ D
 *
 * A has no dependencies
 * B depends on A
 * C depends on A
 * D depends on B and C
 * E depends on C
 * F depends on D
 */
function buildGraph() {
  return [
    makeTask("A", []),
    makeTask("B", ["A"]),
    makeTask("C", ["A"]),
    makeTask("D", ["B", "C"]),
    makeTask("E", ["C"]),
    makeTask("F", ["D"]),
  ];
}

function allIds(tasks: ReturnType<typeof makeTask>[]) {
  return new Set(tasks.map((t) => t.id));
}

describe("traverseGraph", () => {
  const tasks = buildGraph();
  const allowed = allIds(tasks);

  describe("match mode", () => {
    it("returns only seed IDs", () => {
      expect(traverseGraph(["D"], tasks, allowed, "match")).toEqual(["D"]);
    });

    it("returns multiple seeds in task order", () => {
      expect(traverseGraph(["F", "B"], tasks, allowed, "match")).toEqual([
        "B",
        "F",
      ]);
    });

    it("returns empty for no seeds", () => {
      expect(traverseGraph([], tasks, allowed, "match")).toEqual([]);
    });

    it("excludes seeds not in allowed set", () => {
      const restricted = new Set(["A", "B"]);
      expect(traverseGraph(["A", "D"], tasks, restricted, "match")).toEqual([
        "A",
      ]);
    });
  });

  describe("upstream mode", () => {
    it("finds direct dependencies", () => {
      expect(traverseGraph(["B"], tasks, allowed, "upstream")).toEqual([
        "A",
        "B",
      ]);
    });

    it("finds transitive dependencies", () => {
      expect(traverseGraph(["D"], tasks, allowed, "upstream")).toEqual([
        "A",
        "B",
        "C",
        "D",
      ]);
    });

    it("finds deep transitive dependencies", () => {
      expect(traverseGraph(["F"], tasks, allowed, "upstream")).toEqual([
        "A",
        "B",
        "C",
        "D",
        "F",
      ]);
    });

    it("returns only the seed when it has no dependencies", () => {
      expect(traverseGraph(["A"], tasks, allowed, "upstream")).toEqual(["A"]);
    });

    it("merges upstream for multiple seeds", () => {
      expect(traverseGraph(["E", "B"], tasks, allowed, "upstream")).toEqual([
        "A",
        "B",
        "C",
        "E",
      ]);
    });

    it("stops at nodes not in allowed set", () => {
      const restricted = new Set(["B", "D", "F"]);
      // D depends on B and C, but C is not allowed, A is not allowed
      // From F: F→D→B (stops, A not allowed), D→C (not allowed)
      expect(traverseGraph(["F"], tasks, restricted, "upstream")).toEqual([
        "B",
        "D",
        "F",
      ]);
    });
  });

  describe("downstream mode", () => {
    it("finds direct dependents", () => {
      expect(traverseGraph(["A"], tasks, allowed, "downstream")).toEqual([
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
      ]);
    });

    it("finds transitive dependents", () => {
      expect(traverseGraph(["C"], tasks, allowed, "downstream")).toEqual([
        "C",
        "D",
        "E",
        "F",
      ]);
    });

    it("returns only the seed when it has no dependents", () => {
      expect(traverseGraph(["F"], tasks, allowed, "downstream")).toEqual(["F"]);
    });

    it("handles node with multiple downstream paths", () => {
      expect(traverseGraph(["B"], tasks, allowed, "downstream")).toEqual([
        "B",
        "D",
        "F",
      ]);
    });

    it("merges downstream for multiple seeds", () => {
      expect(traverseGraph(["B", "E"], tasks, allowed, "downstream")).toEqual([
        "B",
        "D",
        "E",
        "F",
      ]);
    });

    it("stops at nodes not in allowed set", () => {
      const restricted = new Set(["A", "B", "C"]);
      // A→B (allowed), A→C (allowed), B→D (not allowed), C→D/E (not allowed)
      expect(traverseGraph(["A"], tasks, restricted, "downstream")).toEqual([
        "A",
        "B",
        "C",
      ]);
    });
  });

  describe("both mode", () => {
    it("combines upstream and downstream", () => {
      expect(traverseGraph(["D"], tasks, allowed, "both")).toEqual([
        "A",
        "B",
        "C",
        "D",
        "F",
      ]);
    });

    it("from a middle node covers full connected graph", () => {
      expect(traverseGraph(["C"], tasks, allowed, "both")).toEqual([
        "A",
        "C",
        "D",
        "E",
        "F",
      ]);
    });

    it("from root returns full graph (everything downstream)", () => {
      expect(traverseGraph(["A"], tasks, allowed, "both")).toEqual([
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
      ]);
    });

    it("from leaf returns full upstream chain", () => {
      expect(traverseGraph(["F"], tasks, allowed, "both")).toEqual([
        "A",
        "B",
        "C",
        "D",
        "F",
      ]);
    });

    it("respects allowed set in both directions", () => {
      const restricted = new Set(["C", "D", "E"]);
      // Upstream from D: D→B (not allowed), D→C (allowed), C→A (not allowed)
      // Downstream from D: D→F (not allowed)
      expect(traverseGraph(["D"], tasks, restricted, "both")).toEqual([
        "C",
        "D",
      ]);
    });
  });

  describe("edge cases", () => {
    it("handles empty task list", () => {
      expect(traverseGraph(["A"], [], new Set(), "both")).toEqual([]);
    });

    it("handles seeds not present in tasks", () => {
      expect(traverseGraph(["Z"], tasks, allowed, "upstream")).toEqual([]);
    });

    it("handles seeds not present in tasks but in allowed set", () => {
      const withZ = new Set([...allowed, "Z"]);
      // Z is in allowed but no task object exists for it
      expect(traverseGraph(["Z"], tasks, withZ, "upstream")).toEqual([]);
    });

    it("handles circular dependencies without infinite loops", () => {
      const circular = [
        makeTask("X", ["Z"]),
        makeTask("Y", ["X"]),
        makeTask("Z", ["Y"]),
      ];
      const circAllowed = allIds(circular);
      expect(traverseGraph(["X"], circular, circAllowed, "upstream")).toEqual([
        "X",
        "Y",
        "Z",
      ]);
      expect(traverseGraph(["X"], circular, circAllowed, "downstream")).toEqual(
        ["X", "Y", "Z"]
      );
      expect(traverseGraph(["X"], circular, circAllowed, "both")).toEqual([
        "X",
        "Y",
        "Z",
      ]);
    });

    it("handles self-referencing task", () => {
      const selfRef = [makeTask("S", ["S"])];
      const selfAllowed = allIds(selfRef);
      expect(traverseGraph(["S"], selfRef, selfAllowed, "both")).toEqual(["S"]);
    });

    it("handles disconnected subgraphs", () => {
      const disconnected = [
        makeTask("A", []),
        makeTask("B", ["A"]),
        makeTask("X", []),
        makeTask("Y", ["X"]),
      ];
      const disconnectedAllowed = allIds(disconnected);
      expect(
        traverseGraph(["A"], disconnected, disconnectedAllowed, "downstream")
      ).toEqual(["A", "B"]);
      expect(
        traverseGraph(["Y"], disconnected, disconnectedAllowed, "upstream")
      ).toEqual(["X", "Y"]);
    });

    it("handles dangling incomingLink references", () => {
      // Task references a dependency that does not exist
      const dangling = [makeTask("A", ["MISSING"]), makeTask("B", ["A"])];
      const danglingAllowed = allIds(dangling);
      expect(
        traverseGraph(["A"], dangling, danglingAllowed, "upstream")
      ).toEqual(["A"]);
    });
  });

  describe("cyclic dependencies of length N", () => {
    /**
     * Build a pure cycle of length N:
     *   C0 → C1 → C2 → … → C(N-1) → C0
     * Each node depends on the previous one (wrapping around).
     */
    function buildCycle(n: number) {
      const ids = Array.from({ length: n }, (_, i) => `C${i}`);
      const tasks = ids.map((id, i) => makeTask(id, [ids[(i - 1 + n) % n]]));
      return { tasks, ids, allowed: allIds(tasks) };
    }

    it.each([2, 3, 5, 10, 50])(
      "cycle of length %i terminates for upstream traversal",
      (n) => {
        const { tasks, ids, allowed } = buildCycle(n);
        const result = traverseGraph(["C0"], tasks, allowed, "upstream");
        expect(result).toHaveLength(n);
        expect(result).toEqual(expect.arrayContaining(ids));
      }
    );

    it.each([2, 3, 5, 10, 50])(
      "cycle of length %i terminates for downstream traversal",
      (n) => {
        const { tasks, ids, allowed } = buildCycle(n);
        const result = traverseGraph(["C0"], tasks, allowed, "downstream");
        expect(result).toHaveLength(n);
        expect(result).toEqual(expect.arrayContaining(ids));
      }
    );

    it.each([2, 3, 5, 10, 50])(
      "cycle of length %i terminates for both traversal",
      (n) => {
        const { tasks, ids, allowed } = buildCycle(n);
        const result = traverseGraph(["C0"], tasks, allowed, "both");
        expect(result).toHaveLength(n);
        expect(result).toEqual(expect.arrayContaining(ids));
      }
    );

    it("seeding from any node in a cycle returns all cycle members", () => {
      const { tasks, ids, allowed } = buildCycle(6);
      for (const seed of ids) {
        const result = traverseGraph([seed], tasks, allowed, "both");
        expect(result).toHaveLength(6);
        expect(result).toEqual(expect.arrayContaining(ids));
      }
    });

    it("cycle with a tail: traversal from tail covers cycle + tail", () => {
      // T0 → T1 → C0 → C1 → C2 → C0 (tail feeding into a 3-cycle)
      const cycleTasks = [
        makeTask("T0", []),
        makeTask("T1", ["T0"]),
        makeTask("C0", ["T1", "C2"]),
        makeTask("C1", ["C0"]),
        makeTask("C2", ["C1"]),
      ];
      const cycleAllowed = allIds(cycleTasks);

      // Upstream from C1 should find: C1 ← C0 ← T1 ← T0, and C0 ← C2 ← C1 (cycle)
      const upstream = traverseGraph(
        ["C1"],
        cycleTasks,
        cycleAllowed,
        "upstream"
      );
      expect(upstream).toEqual(["T0", "T1", "C0", "C1", "C2"]);

      // Downstream from T0 should reach T1, then the full cycle
      const downstream = traverseGraph(
        ["T0"],
        cycleTasks,
        cycleAllowed,
        "downstream"
      );
      expect(downstream).toEqual(["T0", "T1", "C0", "C1", "C2"]);
    });

    it("match mode on a cycle returns only the seed", () => {
      const { tasks, allowed } = buildCycle(5);
      expect(traverseGraph(["C0"], tasks, allowed, "match")).toEqual(["C0"]);
    });
  });
});
