import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { mantenedorService } from '../services/mantenedorService';
import type {
  MantenedorBase,
  MantenedorType,
  MantenedoresState,
  CreateMantenedorRequest,
} from '../types/mantenedores';
import { MantenedorType as MantenedorTypes } from '../types/mantenedores';

// ============================================
// Context Types
// ============================================

interface MantenedoresContextType {
  // State
  version: number;
  itemsByType: Record<string, MantenedorBase[]>;
  isLoading: boolean;
  error: string | null;
  
  // Getters
  getItemsByType: (type: MantenedorType) => MantenedorBase[];
  getItemById: (type: MantenedorType, id: number | string) => MantenedorBase | undefined;
  
  // Actions
  createMantenedor: (data: CreateMantenedorRequest) => Promise<MantenedorBase>;
  updateMantenedor: (type: MantenedorType, id: number | string, data: Partial<MantenedorBase>) => Promise<MantenedorBase>;
  deleteMantenedor: (type: MantenedorType, id: number | string) => Promise<void>;
  refreshMantenedores: () => Promise<void>;
}

const MantenedoresContext = createContext<MantenedoresContextType | undefined>(undefined);

// ============================================
// Hook
// ============================================

export const useMantenedores = () => {
  const context = useContext(MantenedoresContext);
  if (context === undefined) {
    throw new Error('useMantenedores must be used within a MantenedoresProvider');
  }
  return context;
};

// ============================================
// Provider
// ============================================

interface MantenedoresProviderProps {
  children: ReactNode;
}

export const MantenedoresProvider: React.FC<MantenedoresProviderProps> = ({ children }) => {
  const [state, setState] = useState<MantenedoresState>(() => {
    // Initialize with cached data if available
    const cached = mantenedorService.getCachedData();
    
    // Initialize all types with empty arrays
    const initialItemsByType: Record<string, MantenedorBase[]> = {};
    Object.values(MantenedorTypes).forEach(type => {
      initialItemsByType[type] = cached?.itemsByType?.[type] || [];
    });
    
    return {
      version: cached?.version || 0,
      itemsByType: initialItemsByType,
      isLoading: true,
      error: null,
    };
  });

  const isInitialized = useRef(false);

  // ============================================
  // Version Check & Data Loading
  // ============================================

  const loadMantenedores = useCallback(async (forceRefresh = false) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!forceRefresh) {
        // Check version first
        const backendVersion = await mantenedorService.getVersion();
        const cachedVersion = mantenedorService.getCachedVersion();

        // If versions match and we have cached data, we're done
        if (cachedVersion !== null && cachedVersion === backendVersion) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      }

      // Versions differ or no cache - fetch all data
      const data = await mantenedorService.getAll();
      
      // Ensure all types have arrays (even empty ones)
      const itemsByType: Record<string, MantenedorBase[]> = {};
      Object.values(MantenedorTypes).forEach(type => {
        itemsByType[type] = data.itemsByType?.[type] || [];
      });

      // Update state
      setState({
        version: data.version,
        itemsByType,
        isLoading: false,
        error: null,
      });

      // Update cache
      mantenedorService.setCachedData({ version: data.version, itemsByType });
    } catch (error) {
      console.error('Error loading mantenedores:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load mantenedores',
      }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      loadMantenedores();
    }
  }, [loadMantenedores]);

  // ============================================
  // Getters
  // ============================================

  const getItemsByType = useCallback((type: MantenedorType): MantenedorBase[] => {
    return state.itemsByType[type] || [];
  }, [state.itemsByType]);

  const getItemById = useCallback((type: MantenedorType, id: number | string): MantenedorBase | undefined => {
    const items = state.itemsByType[type] || [];
    return items.find(item => item.id === id || String(item.id) === String(id));
  }, [state.itemsByType]);

  // ============================================
  // Mutations
  // ============================================

  const createMantenedor = useCallback(async (data: CreateMantenedorRequest): Promise<MantenedorBase> => {
    const response = await mantenedorService.create(data);
    const newItem = response.item;
    const itemType = data.type;

    // Update local state immediately
    setState(prev => {
      const currentItems = prev.itemsByType[itemType] || [];
      const newItemsByType = {
        ...prev.itemsByType,
        [itemType]: [...currentItems, newItem],
      };

      // Update cache
      mantenedorService.setCachedData({
        version: prev.version + 1,
        itemsByType: newItemsByType,
      });

      return {
        ...prev,
        version: prev.version + 1,
        itemsByType: newItemsByType,
      };
    });

    return newItem;
  }, []);

  const updateMantenedor = useCallback(async (
    type: MantenedorType,
    id: number | string,
    data: Partial<MantenedorBase>
  ): Promise<MantenedorBase> => {
    const response = await mantenedorService.update(id, data);
    const updatedItem = response.item;

    // Update local state
    setState(prev => {
      const currentItems = prev.itemsByType[type] || [];
      const newItems = currentItems.map(item =>
        (item.id === id || String(item.id) === String(id)) ? updatedItem : item
      );
      const newItemsByType = {
        ...prev.itemsByType,
        [type]: newItems,
      };

      // Update cache
      mantenedorService.setCachedData({
        version: prev.version + 1,
        itemsByType: newItemsByType,
      });

      return {
        ...prev,
        version: prev.version + 1,
        itemsByType: newItemsByType,
      };
    });

    return updatedItem;
  }, []);

  const deleteMantenedor = useCallback(async (type: MantenedorType, id: number | string): Promise<void> => {
    await mantenedorService.delete(id);

    // Update local state
    setState(prev => {
      const currentItems = prev.itemsByType[type] || [];
      const newItems = currentItems.filter(item =>
        item.id !== id && String(item.id) !== String(id)
      );
      const newItemsByType = {
        ...prev.itemsByType,
        [type]: newItems,
      };

      // Update cache
      mantenedorService.setCachedData({
        version: prev.version + 1,
        itemsByType: newItemsByType,
      });

      return {
        ...prev,
        version: prev.version + 1,
        itemsByType: newItemsByType,
      };
    });
  }, []);

  const refreshMantenedores = useCallback(async (): Promise<void> => {
    await loadMantenedores(true);
  }, [loadMantenedores]);

  // ============================================
  // Context Value
  // ============================================

  const value: MantenedoresContextType = {
    version: state.version,
    itemsByType: state.itemsByType,
    isLoading: state.isLoading,
    error: state.error,
    getItemsByType,
    getItemById,
    createMantenedor,
    updateMantenedor,
    deleteMantenedor,
    refreshMantenedores,
  };

  return (
    <MantenedoresContext.Provider value={value}>
      {children}
    </MantenedoresContext.Provider>
  );
};

export default MantenedoresContext;

