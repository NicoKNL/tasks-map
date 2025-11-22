// Mock React
const React = {
  createElement: jest.fn(),
  Fragment: 'Fragment',
  useState: jest.fn(),
  useEffect: jest.fn(),
  useCallback: jest.fn(),
  useMemo: jest.fn(),
  useRef: jest.fn(),
  useContext: jest.fn(),
  createContext: jest.fn(() => ({
    Provider: jest.fn(({ children }) => children),
    Consumer: jest.fn(),
  })),
  forwardRef: jest.fn((fn) => fn),
};

export const createElement = React.createElement;
export const Fragment = React.Fragment;
export const useState = React.useState;
export const useEffect = React.useEffect;
export const useCallback = React.useCallback;
export const useMemo = React.useMemo;
export const useRef = React.useRef;
export const useContext = React.useContext;
export const createContext = React.createContext;
export const forwardRef = React.forwardRef;

export default React;
