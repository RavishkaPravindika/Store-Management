import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  Unsubscribe
} from 'firebase/database';
import { db } from './firebase';
import { User, Store, Rack, Category, Item } from '../types';

export const SUPER_ADMIN_EMAIL = 'ravishkapravindika99@gmail.com';

// Generate fallback unique ID
export const generateId = () =>
  'id-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);

// Helper to remove any undefined properties recursively (Firebase RTDB throws on undefined)
const sanitizeData = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? '' : value))
  );
};

// ==========================================
// LOCAL STORAGE BACKUP & OPTIMISTIC CACHE
// ==========================================
const getLocalCollection = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`storesync_${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setLocalCollection = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(`storesync_${key}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
};

// ==========================================
// IN-MEMORY PUBSUB / BROADCAST SYSTEM
// ==========================================
const usersListeners = new Set<(users: User[]) => void>();
const storesListeners = new Set<(stores: Store[]) => void>();
const racksListeners = new Set<(racks: Rack[]) => void>();
const categoriesListeners = new Set<(categories: Category[]) => void>();
const itemsListeners = new Set<(items: Item[]) => void>();

const broadcastUsers = (list: User[]) => usersListeners.forEach((fn) => fn(list));
const broadcastStores = (list: Store[]) => storesListeners.forEach((fn) => fn(list));
const broadcastRacks = (list: Rack[]) => racksListeners.forEach((fn) => fn(list));
const broadcastCategories = (list: Category[]) => categoriesListeners.forEach((fn) => fn(list));
const broadcastItems = (list: Item[]) => itemsListeners.forEach((fn) => fn(list));

// ==========================================
// SEED INITIAL DATA (if empty)
// ==========================================
export const seedInitialData = async () => {
  try {
    const localStores = getLocalCollection<Store>('stores');
    let needsSeed = localStores.length === 0;

    try {
      const storesSnapshot = await get(ref(db, 'stores'));
      if (storesSnapshot.exists() && Object.keys(storesSnapshot.val() || {}).length > 0) {
        needsSeed = false;
      }
    } catch {
      // Permission denied or offline, use local
    }

    if (needsSeed) {
      const defaultStoreId = 'store-main-1';
      const defaultRackId = 'rack-main-1';
      const defaultCatId1 = 'cat-elec-1';
      const defaultCatId2 = 'cat-cloth-1';

      const initialStores: Record<string, Store> = {
        [defaultStoreId]: {
          id: defaultStoreId,
          name: 'Flagship Central Store',
          location: 'New York, 5th Ave',
          description: 'Main retail store and central inventory warehouse',
          ownerId: 'super-admin-root',
          metadata: {
            address: '742 5th Avenue, New York, NY',
            managerName: 'Store Operations',
            phone: '+1 (555) 234-5678',
            email: 'central@storesync.io'
          }
        }
      };

      const initialCategories: Record<string, Category> = {
        [defaultCatId1]: {
          id: defaultCatId1,
          name: 'Electronics',
          description: 'Smartphones, accessories, gadgets and displays'
        },
        [defaultCatId2]: {
          id: defaultCatId2,
          name: 'Apparel & Wearables',
          description: 'Clothing, smart watches, and branded merchandise'
        }
      };

      const initialRacks: Record<string, Rack> = {
        [defaultRackId]: {
          id: defaultRackId,
          storeId: defaultStoreId,
          name: 'Rack A1 - Display Front',
          rows: 4,
          cols: 4
        }
      };

      const initialItems: Record<string, Item> = {
        'item-1': {
          id: 'item-1',
          name: 'Wireless Noise-Cancelling Headphones',
          description: 'Premium over-ear wireless headphones with ANC',
          categoryId: defaultCatId1,
          rackId: defaultRackId,
          storeId: defaultStoreId,
          row: 0,
          col: 0,
          attributes: {
            Brand: 'Sony',
            Color: 'Midnight Black',
            Model: 'WH-1000XM5',
            Stock: '12'
          }
        },
        'item-2': {
          id: 'item-2',
          name: 'Wireless Earbuds Pro',
          description: 'Compact in-ear wireless earphones with charging case',
          categoryId: defaultCatId1,
          rackId: defaultRackId,
          storeId: defaultStoreId,
          row: 0,
          col: 0,
          attributes: {
            Brand: 'Apple',
            Color: 'White',
            Model: 'AirPods Pro 2',
            Stock: '24'
          }
        },
        'item-3': {
          id: 'item-3',
          name: 'USB-C Fast Charging Cable (2m)',
          description: 'Braided nylon ultra-durable fast charging cable',
          categoryId: defaultCatId1,
          rackId: defaultRackId,
          storeId: defaultStoreId,
          row: 0,
          col: 0,
          attributes: {
            Length: '2 Meters',
            Power: '100W',
            Color: 'Braided Grey'
          }
        },
        'item-4': {
          id: 'item-4',
          name: 'Smart OLED Fitness Watch',
          description: 'Heart rate, GPS, water resistant smart fitness watch',
          categoryId: defaultCatId2,
          rackId: defaultRackId,
          storeId: defaultStoreId,
          row: 1,
          col: 2,
          attributes: {
            Screen: '1.4 inch OLED',
            Battery: '7 Days',
            Color: 'Space Grey'
          }
        }
      };

      setLocalCollection('stores', Object.values(initialStores));
      setLocalCollection('categories', Object.values(initialCategories));
      setLocalCollection('racks', Object.values(initialRacks));
      setLocalCollection('items', Object.values(initialItems));

      broadcastStores(Object.values(initialStores));
      broadcastCategories(Object.values(initialCategories));
      broadcastRacks(Object.values(initialRacks));
      broadcastItems(Object.values(initialItems));

      try {
        await set(ref(db, 'stores'), initialStores);
        await set(ref(db, 'categories'), initialCategories);
        await set(ref(db, 'racks'), initialRacks);
        await set(ref(db, 'items'), initialItems);
      } catch (err) {
        console.warn('Firebase RTDB write error during seed (check Database Rules in Firebase Console):', err);
      }
    }
  } catch (err) {
    console.warn('Database seed error:', err);
  }
};

// ==========================================
// 1. USERS SERVICE
// ==========================================
export const dbUsers = {
  subscribe: (callback: (users: User[]) => void): Unsubscribe => {
    usersListeners.add(callback);
    callback(getLocalCollection<User>('users'));

    const usersRef = ref(db, 'users');
    const unsubscribeFb = onValue(
      usersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: User[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          setLocalCollection('users', list);
          broadcastUsers(list);
        }
      },
      (error) => {
        console.warn('Firebase users onValue error (check Database Rules):', error);
      }
    );

    return () => {
      usersListeners.delete(callback);
      unsubscribeFb();
    };
  },

  getAll: async (): Promise<User[]> => {
    try {
      const snapshot = await get(ref(db, 'users'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: User[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
        setLocalCollection('users', list);
        return list;
      }
      return getLocalCollection<User>('users');
    } catch {
      return getLocalCollection<User>('users');
    }
  },

  getById: async (uid: string): Promise<User | null> => {
    const local = getLocalCollection<User>('users').find((u) => u.uid === uid);
    try {
      const snapshot = await get(ref(db, `users/${uid}`));
      if (snapshot.exists()) {
        return snapshot.val() as User;
      }
      return local || null;
    } catch {
      return local || null;
    }
  },

  saveUser: async (user: User): Promise<User> => {
    const isSuperAdmin = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const finalUser: User = sanitizeData({
      ...user,
      role: isSuperAdmin ? 'super-admin' : user.role || 'user'
    });

    const localUsers = getLocalCollection<User>('users').filter((u) => u.uid !== finalUser.uid);
    localUsers.push(finalUser);
    setLocalCollection('users', localUsers);
    broadcastUsers(localUsers);

    try {
      await set(ref(db, `users/${finalUser.uid}`), finalUser);
    } catch (err) {
      console.warn('Firebase RTDB saveUser error (check Database Rules):', err);
    }

    return finalUser;
  },

  update: async (uid: string, data: Partial<User>): Promise<void> => {
    const cleanData = sanitizeData(data);
    const localUsers = getLocalCollection<User>('users');
    const idx = localUsers.findIndex((u) => u.uid === uid);
    if (idx !== -1) {
      localUsers[idx] = { ...localUsers[idx], ...cleanData };
      setLocalCollection('users', localUsers);
      broadcastUsers(localUsers);
    }

    try {
      await update(ref(db, `users/${uid}`), cleanData);
    } catch (err) {
      console.warn('Firebase RTDB updateUser error (check Database Rules):', err);
    }
  },

  delete: async (uid: string): Promise<void> => {
    const localUsers = getLocalCollection<User>('users').filter((u) => u.uid !== uid);
    setLocalCollection('users', localUsers);
    broadcastUsers(localUsers);

    try {
      await remove(ref(db, `users/${uid}`));
    } catch (err) {
      console.warn('Firebase RTDB deleteUser error (check Database Rules):', err);
    }
  }
};

// ==========================================
// 2. STORES SERVICE
// ==========================================
export const dbStores = {
  subscribe: (callback: (stores: Store[]) => void): Unsubscribe => {
    storesListeners.add(callback);
    callback(getLocalCollection<Store>('stores'));

    const storesRef = ref(db, 'stores');
    const unsubscribeFb = onValue(
      storesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: Store[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          setLocalCollection('stores', list);
          broadcastStores(list);
        }
      },
      (error) => {
        console.warn('Firebase stores onValue error (check Database Rules):', error);
      }
    );

    return () => {
      storesListeners.delete(callback);
      unsubscribeFb();
    };
  },

  getAll: async (): Promise<Store[]> => {
    try {
      const snapshot = await get(ref(db, 'stores'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: Store[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
        setLocalCollection('stores', list);
        return list;
      }
      return getLocalCollection<Store>('stores');
    } catch {
      return getLocalCollection<Store>('stores');
    }
  },

  create: async (store: Omit<Store, 'id'>): Promise<Store> => {
    const id = generateId();
    const newStore: Store = sanitizeData({ ...store, id });

    // Optimistic local update
    const local = getLocalCollection<Store>('stores');
    local.push(newStore);
    setLocalCollection('stores', local);
    broadcastStores(local);

    // Persist to Firebase Realtime Database
    try {
      await set(ref(db, `stores/${id}`), newStore);
    } catch (err) {
      console.warn('Firebase RTDB createStore error (check Database Rules):', err);
    }

    return newStore;
  },

  update: async (id: string, data: Partial<Store>): Promise<void> => {
    const cleanData = sanitizeData(data);
    const local = getLocalCollection<Store>('stores');
    const idx = local.findIndex((s) => s.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...cleanData };
      setLocalCollection('stores', local);
      broadcastStores(local);
    }

    try {
      await update(ref(db, `stores/${id}`), cleanData);
    } catch (err) {
      console.warn('Firebase RTDB updateStore error (check Database Rules):', err);
    }
  },

  delete: async (id: string): Promise<void> => {
    const local = getLocalCollection<Store>('stores').filter((s) => s.id !== id);
    setLocalCollection('stores', local);
    broadcastStores(local);

    try {
      await remove(ref(db, `stores/${id}`));
    } catch (err) {
      console.warn('Firebase RTDB deleteStore error (check Database Rules):', err);
    }
  }
};

// ==========================================
// 3. RACKS SERVICE
// ==========================================
export const dbRacks = {
  subscribe: (callback: (racks: Rack[]) => void): Unsubscribe => {
    racksListeners.add(callback);
    callback(getLocalCollection<Rack>('racks'));

    const racksRef = ref(db, 'racks');
    const unsubscribeFb = onValue(
      racksRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: Rack[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          setLocalCollection('racks', list);
          broadcastRacks(list);
        }
      },
      (error) => {
        console.warn('Firebase racks onValue error (check Database Rules):', error);
      }
    );

    return () => {
      racksListeners.delete(callback);
      unsubscribeFb();
    };
  },

  getAll: async (): Promise<Rack[]> => {
    try {
      const snapshot = await get(ref(db, 'racks'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: Rack[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
        setLocalCollection('racks', list);
        return list;
      }
      return getLocalCollection<Rack>('racks');
    } catch {
      return getLocalCollection<Rack>('racks');
    }
  },

  create: async (rack: Omit<Rack, 'id'>): Promise<Rack> => {
    const id = generateId();
    const newRack: Rack = sanitizeData({ ...rack, id });

    const local = getLocalCollection<Rack>('racks');
    local.push(newRack);
    setLocalCollection('racks', local);
    broadcastRacks(local);

    try {
      await set(ref(db, `racks/${id}`), newRack);
    } catch (err) {
      console.warn('Firebase RTDB createRack error (check Database Rules):', err);
    }

    return newRack;
  },

  update: async (id: string, data: Partial<Rack>): Promise<void> => {
    const cleanData = sanitizeData(data);
    const local = getLocalCollection<Rack>('racks');
    const idx = local.findIndex((r) => r.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...cleanData };
      setLocalCollection('racks', local);
      broadcastRacks(local);
    }

    try {
      await update(ref(db, `racks/${id}`), cleanData);
    } catch (err) {
      console.warn('Firebase RTDB updateRack error (check Database Rules):', err);
    }
  },

  delete: async (id: string): Promise<void> => {
    const local = getLocalCollection<Rack>('racks').filter((r) => r.id !== id);
    setLocalCollection('racks', local);
    broadcastRacks(local);

    try {
      await remove(ref(db, `racks/${id}`));
    } catch (err) {
      console.warn('Firebase RTDB deleteRack error (check Database Rules):', err);
    }
  }
};

// ==========================================
// 4. CATEGORIES SERVICE
// ==========================================
export const dbCategories = {
  subscribe: (callback: (categories: Category[]) => void): Unsubscribe => {
    categoriesListeners.add(callback);
    callback(getLocalCollection<Category>('categories'));

    const catRef = ref(db, 'categories');
    const unsubscribeFb = onValue(
      catRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: Category[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          setLocalCollection('categories', list);
          broadcastCategories(list);
        }
      },
      (error) => {
        console.warn('Firebase categories onValue error (check Database Rules):', error);
      }
    );

    return () => {
      categoriesListeners.delete(callback);
      unsubscribeFb();
    };
  },

  getAll: async (): Promise<Category[]> => {
    try {
      const snapshot = await get(ref(db, 'categories'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: Category[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
        setLocalCollection('categories', list);
        return list;
      }
      return getLocalCollection<Category>('categories');
    } catch {
      return getLocalCollection<Category>('categories');
    }
  },

  create: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const id = generateId();
    const newCategory: Category = sanitizeData({ ...category, id });

    const local = getLocalCollection<Category>('categories');
    local.push(newCategory);
    setLocalCollection('categories', local);
    broadcastCategories(local);

    try {
      await set(ref(db, `categories/${id}`), newCategory);
    } catch (err) {
      console.warn('Firebase RTDB createCategory error (check Database Rules):', err);
    }

    return newCategory;
  },

  update: async (id: string, data: Partial<Category>): Promise<void> => {
    const cleanData = sanitizeData(data);
    const local = getLocalCollection<Category>('categories');
    const idx = local.findIndex((c) => c.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...cleanData };
      setLocalCollection('categories', local);
      broadcastCategories(local);
    }

    try {
      await update(ref(db, `categories/${id}`), cleanData);
    } catch (err) {
      console.warn('Firebase RTDB updateCategory error (check Database Rules):', err);
    }
  },

  delete: async (id: string): Promise<void> => {
    const local = getLocalCollection<Category>('categories').filter((c) => c.id !== id);
    setLocalCollection('categories', local);
    broadcastCategories(local);

    try {
      await remove(ref(db, `categories/${id}`));
    } catch (err) {
      console.warn('Firebase RTDB deleteCategory error (check Database Rules):', err);
    }
  }
};

// ==========================================
// 5. ITEMS SERVICE
// ==========================================
export const dbItems = {
  subscribe: (callback: (items: Item[]) => void): Unsubscribe => {
    itemsListeners.add(callback);
    callback(getLocalCollection<Item>('items'));

    const itemsRef = ref(db, 'items');
    const unsubscribeFb = onValue(
      itemsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: Item[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          setLocalCollection('items', list);
          broadcastItems(list);
        }
      },
      (error) => {
        console.warn('Firebase items onValue error (check Database Rules):', error);
      }
    );

    return () => {
      itemsListeners.delete(callback);
      unsubscribeFb();
    };
  },

  getAll: async (): Promise<Item[]> => {
    try {
      const snapshot = await get(ref(db, 'items'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: Item[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
        setLocalCollection('items', list);
        return list;
      }
      return getLocalCollection<Item>('items');
    } catch {
      return getLocalCollection<Item>('items');
    }
  },

  create: async (item: Omit<Item, 'id'>): Promise<Item> => {
    const id = generateId();
    const newItem: Item = sanitizeData({ ...item, id });

    // Instant optimistic broadcast & local cache
    const local = getLocalCollection<Item>('items');
    local.push(newItem);
    setLocalCollection('items', local);
    broadcastItems(local);

    // Save to Firebase Realtime Database
    try {
      await set(ref(db, `items/${id}`), newItem);
    } catch (err) {
      console.warn('Firebase RTDB createItem error (check Database Rules):', err);
    }

    return newItem;
  },

  update: async (id: string, data: Partial<Item>): Promise<void> => {
    const cleanData = sanitizeData(data);
    const local = getLocalCollection<Item>('items');
    const idx = local.findIndex((i) => i.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...cleanData };
      setLocalCollection('items', local);
      broadcastItems(local);
    }

    try {
      await update(ref(db, `items/${id}`), cleanData);
    } catch (err) {
      console.warn('Firebase RTDB updateItem error (check Database Rules):', err);
    }
  },

  delete: async (id: string): Promise<void> => {
    const local = getLocalCollection<Item>('items').filter((i) => i.id !== id);
    setLocalCollection('items', local);
    broadcastItems(local);

    try {
      await remove(ref(db, `items/${id}`));
    } catch (err) {
      console.warn('Firebase RTDB deleteItem error (check Database Rules):', err);
    }
  }
};
