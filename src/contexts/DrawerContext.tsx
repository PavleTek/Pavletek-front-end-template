import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface DrawerConfig {
  [key: string]: any;
}

interface DrawerContextType {
  openDrawer: (id: string, config?: DrawerConfig) => void;
  closeDrawer: (id: string) => void;
  isDrawerOpen: (id: string) => boolean;
  getDrawerStack: () => string[];
  getDrawerConfig: (id: string) => DrawerConfig | undefined;
  getDrawerZIndex: (id: string) => number;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};

interface DrawerProviderProps {
  children: ReactNode;
}

const BASE_Z_INDEX = 50;
const Z_INDEX_INCREMENT = 10;

export const DrawerProvider: React.FC<DrawerProviderProps> = ({ children }) => {
  const [drawerStack, setDrawerStack] = useState<string[]>([]);
  const [drawerConfigs, setDrawerConfigs] = useState<Record<string, DrawerConfig>>({});

  const openDrawer = useCallback((id: string, config?: DrawerConfig) => {
    setDrawerStack((prevStack) => {
      // If drawer is already open, don't add it again
      if (prevStack.includes(id)) {
        return prevStack;
      }
      return [...prevStack, id];
    });
    if (config) {
      setDrawerConfigs((prev) => ({ ...prev, [id]: config }));
    }
  }, []);

  const closeDrawer = useCallback((id: string) => {
    setDrawerStack((prevStack) => prevStack.filter((drawerId) => drawerId !== id));
    setDrawerConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[id];
      return newConfigs;
    });
  }, []);

  const isDrawerOpen = useCallback(
    (id: string) => {
      return drawerStack.includes(id);
    },
    [drawerStack]
  );

  const getDrawerStack = useCallback(() => {
    return [...drawerStack];
  }, [drawerStack]);

  const getDrawerConfig = useCallback(
    (id: string) => {
      return drawerConfigs[id];
    },
    [drawerConfigs]
  );

  const getDrawerZIndex = useCallback(
    (id: string) => {
      const stackIndex = drawerStack.indexOf(id);
      if (stackIndex === -1) {
        return BASE_Z_INDEX;
      }
      return BASE_Z_INDEX + stackIndex * Z_INDEX_INCREMENT;
    },
    [drawerStack]
  );

  const value: DrawerContextType = {
    openDrawer,
    closeDrawer,
    isDrawerOpen,
    getDrawerStack,
    getDrawerConfig,
    getDrawerZIndex,
  };

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
};

