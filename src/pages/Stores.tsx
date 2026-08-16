import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbStores, dbRacks, dbItems } from '../lib/db';
import { Store } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '../components/ui/Card';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  StoreIcon,
  MailIcon
} from 'lucide-react';

export const Stores: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    metadata: {
      address: '',
      contact: '',
      managerName: '',
      phone: '',
      email: ''
    }
  });

  useEffect(() => {
    // Subscribe to real-time stores from Firebase Realtime Database
    const unsubscribe = dbStores.subscribe((storeList) => {
      let visibleStores = storeList;
      if (currentUser?.role === 'user') {
        visibleStores = storeList.filter((s) =>
          currentUser.assignedStores?.includes(s.id)
        );
      }
      setStores(visibleStores);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleOpenModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        location: store.location,
        description: store.description || '',
        metadata: {
          address: store.metadata?.address || '',
          contact: store.metadata?.contact || '',
          managerName: store.metadata?.managerName || '',
          phone: store.metadata?.phone || '',
          email: store.metadata?.email || ''
        }
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        location: '',
        description: '',
        metadata: {
          address: '',
          contact: '',
          managerName: '',
          phone: '',
          email: ''
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStore(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingStore) {
        await dbStores.update(editingStore.id, {
          ...formData,
          ownerId: editingStore.ownerId
        });
      } else {
        await dbStores.create({
          ...formData,
          ownerId: currentUser?.uid || 'system'
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving store:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, storeName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${storeName}"? This will also remove associated racks and inventory items.`
      )
    ) {
      try {
        await dbStores.delete(id);
        // Cascade delete racks and items for this store
        const allRacks = await dbRacks.getAll();
        const storeRacks = allRacks.filter((r) => r.storeId === id);
        for (const rack of storeRacks) {
          await dbRacks.delete(rack.id);
        }
        const allItems = await dbItems.getAll();
        const storeItems = allItems.filter((i) => i.storeId === id);
        for (const item of storeItems) {
          await dbItems.delete(item.id);
        }
      } catch (err) {
        console.error('Error deleting store:', err);
      }
    }
  };

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Store Locations
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your retail store branches, warehouses, and managers
          </p>
        </div>

        {currentUser?.role !== 'user' && (
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 shadow-sm"
          >
            <PlusIcon className="h-4 w-4" /> Add Store
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search stores by name, city, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredStores.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-gray-200 border-dashed">
          <StoreIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">No stores found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No store locations match your search query.'
              : 'Get started by creating your first store branch or warehouse location.'}
          </p>
          {currentUser?.role !== 'user' && !searchQuery && (
            <Button
              onClick={() => handleOpenModal()}
              className="mt-4"
              variant="secondary"
            >
              Add First Store
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="flex flex-col h-full hover:shadow-md transition-shadow border-gray-200"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                      <StoreIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">{store.name}</CardTitle>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                        {store.location}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-1 pb-4">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {store.description || 'No description provided.'}
                </p>

                <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                  {store.metadata?.managerName && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                      <span>Manager: <strong className="text-gray-700">{store.metadata.managerName}</strong></span>
                    </div>
                  )}
                  {store.metadata?.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                      <span>{store.metadata.phone}</span>
                    </div>
                  )}
                  {store.metadata?.email && (
                    <div className="flex items-center gap-2">
                      <MailIcon className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{store.metadata.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              {currentUser?.role !== 'user' && (
                <CardFooter className="bg-slate-50/80 justify-end gap-2 py-2.5 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(store)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <EditIcon className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(store.id, store.name)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Store Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingStore ? `Edit Store: ${editingStore.name}` : 'Add New Store'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1">
                Store Location Details
              </h3>
              <Input
                label="Store Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g. West Coast Distribution Center"
              />

              <Input
                label="City / Region"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                required
                placeholder="e.g. San Francisco, CA"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Primary regional inventory hub..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1">
                Manager & Contact
              </h3>
              <Input
                label="Full Street Address"
                value={formData.metadata.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, address: e.target.value }
                  })
                }
                placeholder="100 Market St, Suite 400"
              />

              <Input
                label="Manager Name"
                value={formData.metadata.managerName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, managerName: e.target.value }
                  })
                }
                placeholder="Alex Morgan"
              />

              <Input
                label="Phone Number"
                value={formData.metadata.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, phone: e.target.value }
                  })
                }
                placeholder="+1 (555) 019-2834"
              />

              <Input
                label="Contact Email"
                type="email"
                value={formData.metadata.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, email: e.target.value }
                  })
                }
                placeholder="manager@storesync.io"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingStore ? 'Save Changes' : 'Create Store'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};