// Test script for the improved layout algorithm
const dagre = require('@dagrejs/dagre');

// Mock Node and Edge types
class MockNode {
  constructor(id, width = 200, height = 100) {
    this.id = id;
    this.width = width;
    this.height = height;
    this.position = { x: 0, y: 0 };
  }
}

class MockEdge {
  constructor(source, target) {
    this.source = source;
    this.target = target;
  }
}

// Import the layout function (we'll simulate it here)
function findConnectedComponents(nodes, edges) {
  const nodeIds = new Set(nodes.map(node => node.id));
  const adjacency = new Map();
  
  nodes.forEach(node => {
    adjacency.set(node.id, []);
  });
  
  edges.forEach(edge => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency.get(edge.source).push(edge.target);
      adjacency.get(edge.target).push(edge.source);
    }
  });
  
  const visited = new Set();
  const components = [];
  
  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      const component = [];
      const queue = [nodeId];
      
      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        
        visited.add(current);
        component.push(current);
        
        const neighbors = adjacency.get(current) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
      
      if (component.length > 0) {
        components.push(component);
      }
    }
  }
  
  return components;
}

// Test case 1: Multiple disconnected trees
console.log("Test Case 1: Multiple disconnected trees");
const nodes1 = [
  new MockNode('A'),
  new MockNode('B'), 
  new MockNode('C'),
  new MockNode('X'),
  new MockNode('Y'),
  new MockNode('Z'),
  new MockNode('S')
];

const edges1 = [
  new MockEdge('A', 'B'),
  new MockEdge('B', 'C'),
  new MockEdge('X', 'Y'),
  new MockEdge('Y', 'Z')
  // S is isolated
];

const components1 = findConnectedComponents(nodes1, edges1);
console.log("Components found:", components1);
console.log("Expected: 3 components");
console.log("Actual: ", components1.length, "components");

// Verify each component
const expectedComponents = [
  ['A', 'B', 'C'],
  ['X', 'Y', 'Z'], 
  ['S']
];

let testPassed = true;
if (components1.length !== expectedComponents.length) {
  testPassed = false;
} else {
  // Check if all expected components are present (order may vary)
  const componentSets = components1.map(comp => new Set(comp));
  for (const expected of expectedComponents) {
    const found = componentSets.some(set => {
      if (set.size !== expected.length) return false;
      return expected.every(item => set.has(item));
    });
    if (!found) {
      testPassed = false;
      break;
    }
  }
}

console.log("Component detection test:", testPassed ? "PASSED" : "FAILED");

// Test case 2: Single connected component
console.log("\nTest Case 2: Single connected component");
const nodes2 = [
  new MockNode('1'),
  new MockNode('2'),
  new MockNode('3'),
  new MockNode('4')
];

const edges2 = [
  new MockEdge('1', '2'),
  new MockEdge('2', '3'),
  new MockEdge('3', '4')
];

const components2 = findConnectedComponents(nodes2, edges2);
console.log("Components found:", components2);
console.log("Expected: 1 component");
console.log("Component detection test:", components2.length === 1 ? "PASSED" : "FAILED");

// Test case 3: All isolated nodes
console.log("\nTest Case 3: All isolated nodes");
const nodes3 = [
  new MockNode('I1'),
  new MockNode('I2'),
  new MockNode('I3')
];

const edges3 = [];

const components3 = findConnectedComponents(nodes3, edges3);
console.log("Components found:", components3);
console.log("Expected: 3 components (each node isolated)");
console.log("Component detection test:", components3.length === 3 ? "PASSED" : "FAILED");

console.log("\nLayout algorithm improvement test completed!");