import api from './api';
import type {
  MantenedoresResponse,
  VersionResponse,
  CreateMantenedorRequest,
  MantenedorResponse,
  MantenedorBase,
  MantenedorType,
} from '../types/mantenedores';

const CACHE_KEY = 'mantenedores_cache';
const VERSION_KEY = 'mantenedores_version';

// ============================================
// API Calls
// ============================================

export const mantenedorService = {
  /**
   * Get the current mantenedores version from the backend
   */
  async getVersion(): Promise<number> {
    const response = await api.get<VersionResponse>('/mantenedores/version');
    return response.data.version;
  },

  /**
   * Get all mantenedores from the backend
   */
  async getAll(): Promise<MantenedoresResponse> {
    const response = await api.get<MantenedoresResponse>('/mantenedores');
    return response.data;
  },

  /**
   * Get mantenedores by type
   */
  async getByType(type: MantenedorType): Promise<MantenedorBase[]> {
    const response = await api.get<{ items: MantenedorBase[] }>(`/mantenedores/type/${type}`);
    return response.data.items;
  },

  /**
   * Create a new mantenedor
   */
  async create(data: CreateMantenedorRequest): Promise<MantenedorResponse> {
    const response = await api.post<MantenedorResponse>('/mantenedores', data);
    return response.data;
  },

  /**
   * Update an existing mantenedor
   */
  async update(id: number | string, data: Partial<MantenedorBase>): Promise<MantenedorResponse> {
    const response = await api.put<MantenedorResponse>(`/mantenedores/${id}`, data);
    return response.data;
  },

  /**
   * Delete a mantenedor
   */
  async delete(id: number | string): Promise<void> {
    await api.delete(`/mantenedores/${id}`);
  },

  /**
   * Get available mantenedor types
   */
  async getTypes(): Promise<string[]> {
    const response = await api.get<{ types: string[] }>('/mantenedores/types');
    return response.data.types;
  },

  // ============================================
  // Local Storage Cache
  // ============================================

  /**
   * Get cached mantenedores from local storage
   */
  getCachedData(): MantenedoresResponse | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const version = localStorage.getItem(VERSION_KEY);
      
      if (cached && version) {
        return {
          version: parseInt(version, 10),
          itemsByType: JSON.parse(cached),
        };
      }
    } catch (error) {
      console.error('Error reading mantenedores cache:', error);
    }
    return null;
  },

  /**
   * Save mantenedores to local storage cache
   */
  setCachedData(data: MantenedoresResponse): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.itemsByType));
      localStorage.setItem(VERSION_KEY, String(data.version));
    } catch (error) {
      console.error('Error saving mantenedores cache:', error);
    }
  },

  /**
   * Get cached version
   */
  getCachedVersion(): number | null {
    try {
      const version = localStorage.getItem(VERSION_KEY);
      return version ? parseInt(version, 10) : null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Clear the cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(VERSION_KEY);
    } catch (error) {
      console.error('Error clearing mantenedores cache:', error);
    }
  },
};

export default mantenedorService;

