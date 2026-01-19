import { useState, useCallback, useRef } from 'react';

interface UseUndoRedoOptions<T> {
  maxHistorySize?: number;
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T, skipHistory?: boolean) => void;
  undo: () => T | undefined;
  redo: () => T | undefined;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions<T> = {}
): UseUndoRedoReturn<T> {
  const { maxHistorySize = 50 } = options;
  
  const [state, setStateInternal] = useState<T>(initialState);
  const historyRef = useRef<T[]>([initialState]);
  const currentIndexRef = useRef<number>(0);

  const setState = useCallback((newState: T, skipHistory: boolean = false) => {
    setStateInternal(newState);
    
    if (skipHistory) return;
    
    // Remove any future states if we're not at the end
    const newHistory = historyRef.current.slice(0, currentIndexRef.current + 1);
    
    // Add new state
    newHistory.push(newState);
    
    // Trim history if it exceeds max size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    } else {
      currentIndexRef.current++;
    }
    
    historyRef.current = newHistory;
  }, [maxHistorySize]);

  const undo = useCallback((): T | undefined => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const previousState = historyRef.current[currentIndexRef.current];
      setStateInternal(previousState);
      return previousState;
    }
    return undefined;
  }, []);

  const redo = useCallback((): T | undefined => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const nextState = historyRef.current[currentIndexRef.current];
      setStateInternal(nextState);
      return nextState;
    }
    return undefined;
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [state];
    currentIndexRef.current = 0;
  }, [state]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
    clearHistory,
  };
}
