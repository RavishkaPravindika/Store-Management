import { User, Store, Rack, Category, Item } from '../types';

const SUPER_ADMIN_EMAIL = 'ravishkapravinsika99@gmail.com';

// Generic CRUD operations using localStorage
const getCollection = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setCollection = <T,>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// Initialize DB with Super Admin if not exists
export const initDb = () => {
  const users = getCollection<User>('users');
  if (!users.find((u) => u.email === SUPER_ADMIN_EMAIL)) {
    users.push({
      uid: generateId(),
      email: SUPER_ADMIN_EMAIL,
      role: 'super-admin',
      name: 'Super Admin',
      createdAt: Date.now()
    });
    setCollection('users', users);
  }
};

// Users
export const dbUsers = {
  getAll: () => getCollection<User>('users'),
  getById: (uid: string) =>
  getCollection<User>('users').find((u) => u.uid === uid),
  getByEmail: (email: string) =>
  getCollection<User>('users').find((u) => u.email === email),
  create: (user: Omit<User, 'uid' | 'createdAt'>) => {
    const users = getCollection<User>('users');
    const newUser = { ...user, uid: generateId(), createdAt: Date.now() };
    users.push(newUser);
    setCollection('users', users);
    return newUser;
  },
  update: (uid: string, data: Partial<User>) => {
    const users = getCollection<User>('users');
    const index = users.findIndex((u) => u.uid === uid);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      setCollection('users', users);
      return users[index];
    }
    return null;
  },
  delete: (uid: string) => {
    const users = getCollection<User>('users');
    setCollection(
      'users',
      users.filter((u) => u.uid !== uid)
    );
  }
};

// Stores
export const dbStores = {
  getAll: () => getCollection<Store>('stores'),
  getById: (id: string) =>
  getCollection<Store>('stores').find((s) => s.id === id),
  create: (store: Omit<Store, 'id'>) => {
    const stores = getCollection<Store>('stores');
    const newStore = { ...store, id: generateId() };
    stores.push(newStore);
    setCollection('stores', stores);
    return newStore;
  },
  update: (id: string, data: Partial<Store>) => {
    const stores = getCollection<Store>('stores');
    const index = stores.findIndex((s) => s.id === id);
    if (index !== -1) {
      stores[index] = { ...stores[index], ...data };
      setCollection('stores', stores);
      return stores[index];
    }
    return null;
  },
  delete: (id: string) => {
    const stores = getCollection<Store>('stores');
    setCollection(
      'stores',
      stores.filter((s) => s.id !== id)
    );
  }
};

// Racks
export const dbRacks = {
  getAll: () => getCollection<Rack>('racks'),
  getByStoreId: (storeId: string) =>
  getCollection<Rack>('racks').filter((r) => r.storeId === storeId),
  create: (rack: Omit<Rack, 'id'>) => {
    const racks = getCollection<Rack>('racks');
    const newRack = { ...rack, id: generateId() };
    racks.push(newRack);
    setCollection('racks', racks);
    return newRack;
  },
  update: (id: string, data: Partial<Rack>) => {
    const racks = getCollection<Rack>('racks');
    const index = racks.findIndex((r) => r.id === id);
    if (index !== -1) {
      racks[index] = { ...racks[index], ...data };
      setCollection('racks', racks);
      return racks[index];
    }
    return null;
  },
  delete: (id: string) => {
    const racks = getCollection<Rack>('racks');
    setCollection(
      'racks',
      racks.filter((r) => r.id !== id)
    );
  }
};

// Categories
export const dbCategories = {
  getAll: () => getCollection<Category>('categories'),
  create: (category: Omit<Category, 'id'>) => {
    const categories = getCollection<Category>('categories');
    const newCategory = { ...category, id: generateId() };
    categories.push(newCategory);
    setCollection('categories', categories);
    return newCategory;
  },
  update: (id: string, data: Partial<Category>) => {
    const categories = getCollection<Category>('categories');
    const index = categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...data };
      setCollection('categories', categories);
      return categories[index];
    }
    return null;
  },
  delete: (id: string) => {
    const categories = getCollection<Category>('categories');
    setCollection(
      'categories',
      categories.filter((c) => c.id !== id)
    );
  }
};

// Items
export const dbItems = {
  getAll: () => getCollection<Item>('items'),
  getByRackId: (rackId: string) =>
  getCollection<Item>('items').filter((i) => i.rackId === rackId),
  create: (item: Omit<Item, 'id'>) => {
    const items = getCollection<Item>('items');
    const newItem = { ...item, id: generateId() };
    items.push(newItem);
    setCollection('items', items);
    return newItem;
  },
  update: (id: string, data: Partial<Item>) => {
    const items = getCollection<Item>('items');
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data };
      setCollection('items', items);
      return items[index];
    }
    return null;
  },
  delete: (id: string) => {
    const items = getCollection<Item>('items');
    setCollection(
      'items',
      items.filter((i) => i.id !== id)
    );
  }
};