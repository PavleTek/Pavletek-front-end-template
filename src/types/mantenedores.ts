// ============================================
// Mantenedor Types - Discriminated Union System
// ============================================

// Available mantenedor types - must match backend enum
export const MantenedorType = {
  CONTAINER: 'CONTAINER',
  CONTAINER_TYPE: 'CONTAINER_TYPE',
  VESSEL: 'VESSEL',
} as const;

export type MantenedorType = typeof MantenedorType[keyof typeof MantenedorType];

// Base interface for all mantenedores
export interface MantenedorBase {
  id: number | string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// Type-specific interfaces
export interface ContainerType extends MantenedorBase {
  description?: string;
  code?: string;
}

export interface Container extends MantenedorBase {
  containerTypeId: number;
  code?: string;
  capacity?: number;
}

export interface Vessel extends MantenedorBase {
  code: string;
  onuCode?: string;
  flag?: string;
}

// Union type for all mantenedores
export type Mantenedor = ContainerType | Container | Vessel;

// Type mapping for type-safe access
export interface MantenedorTypeMap {
  [MantenedorType.CONTAINER]: Container;
  [MantenedorType.CONTAINER_TYPE]: ContainerType;
  [MantenedorType.VESSEL]: Vessel;
}

// ============================================
// UI Schema System
// ============================================

// Field types for UI rendering
export type UIFieldType = 'text' | 'number' | 'dropdown' | 'textarea' | 'checkbox';

// Single field schema
export interface UIFieldSchema {
  name: string;           // Field key in the data object
  label: string;          // Display label
  type: UIFieldType;      // How to render the field
  required?: boolean;     // Is this field required?
  placeholder?: string;   // Placeholder text
  sourceType?: MantenedorType; // For dropdowns: which mantenedor type to source options from
}

// Complete UI schema for a mantenedor type
export interface UISchema {
  title: string;          // Drawer title for this type
  description?: string;   // Optional description
  fields: UIFieldSchema[];// Fields to render
}

// UI Schema Registry - maps type to UI schema
export const uiSchemas: Record<MantenedorType, UISchema> = {
  [MantenedorType.CONTAINER_TYPE]: {
    title: 'Container Type',
    description: 'Define a new container type',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter container type name' },
      { name: 'code', label: 'Code', type: 'text', placeholder: 'Optional code identifier' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this container type' },
    ],
  },
  [MantenedorType.CONTAINER]: {
    title: 'Container',
    description: 'Add a new container',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter container name' },
      { name: 'containerTypeId', label: 'Container Type', type: 'dropdown', required: true, sourceType: MantenedorType.CONTAINER_TYPE },
      { name: 'code', label: 'Code', type: 'text', placeholder: 'Container code' },
      { name: 'capacity', label: 'Capacity', type: 'number', placeholder: 'Capacity in units' },
    ],
  },
  [MantenedorType.VESSEL]: {
    title: 'Vessel',
    description: 'Register a new vessel',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter vessel name' },
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Vessel code' },
      { name: 'onuCode', label: 'ONU Code', type: 'text', placeholder: 'UN/LOCODE' },
      { name: 'flag', label: 'Flag', type: 'text', placeholder: 'Country flag' },
    ],
  },
};

// Helper to get UI schema for a type
export function getUISchema(type: MantenedorType): UISchema | null {
  return uiSchemas[type] || null;
}

// ============================================
// State Types
// ============================================

// Global mantenedores state shape
export interface MantenedoresState {
  version: number;
  itemsByType: Record<MantenedorType, MantenedorBase[]>;
  isLoading: boolean;
  error: string | null;
}

// API response types
export interface MantenedoresResponse {
  version: number;
  itemsByType: Record<string, MantenedorBase[]>;
}

export interface VersionResponse {
  version: number;
}

export interface CreateMantenedorRequest {
  type: MantenedorType;
  name: string;
  [key: string]: any;
}

export interface MantenedorResponse {
  message: string;
  item: MantenedorBase & { type: MantenedorType };
}
