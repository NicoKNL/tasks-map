// Mock ReactFlow
export interface Node<T = any> {
  id: string;
  type?: string;
  data: T;
  position: { x: number; y: number };
}

export interface Edge<T = any> {
  id: string;
  source: string;
  target: string;
  data?: T;
}

export interface Position {
  x: number;
  y: number;
}

export const ReactFlow = jest.fn();
export const useNodesState = jest.fn();
export const useEdgesState = jest.fn();
export const MarkerType = {
  Arrow: 'arrow',
  ArrowClosed: 'arrowclosed',
};

export default ReactFlow;
