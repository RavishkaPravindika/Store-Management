export type Role = 'super-admin' | 'admin' | 'user';

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
  createdAt: number;
  assignedStores?: string[];
}

export interface StoreMetadata {
  address?: string;
  contact?: string;
  managerName?: string;
  phone?: string;
  email?: string;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  description: string;
  ownerId: string;
  metadata: StoreMetadata;
}

export interface Rack {
  id: string;
  storeId: string;
  name: string;
  rows: number;
  cols: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  rackId: string;
  storeId: string;
  row: number;
  col: number;
  attributes: Record<string, string>;
}