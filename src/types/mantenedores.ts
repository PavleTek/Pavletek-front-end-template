export const MantenedorType = {
  TYPE1: 'TYPE1',
  TYPE2: 'TYPE2',
  TYPE3: 'TYPE3',
} as const;

export type MantenedorType = typeof MantenedorType[keyof typeof MantenedorType];

export interface MantenedorType1 {
  id: number | string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface MantenedorType2 {
  id: number | string;
  name: string;
  category: string;
  priority: number;
  isActive: boolean;
}

export interface MantenedorType3 {
  id: number | string;
  name: string;
  location: string;
  tags: string[];
  metadata: Record<string, any>;
}

