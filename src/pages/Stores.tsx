import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbStores } from '../lib/mockDb';
import { Store } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter } from
'../components/ui/Card';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  StoreIcon } from
'lucide-react';
export const Stores: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
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
  const loadStores = () => {
    setStores(dbStores.getAll());
  };
  useEffect(() => {
    loadStores();
  }, []);
  const handleOpenModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        location: store.location,
        description: store.description,
        metadata: {
          address: store.metadata.address || '',
          contact: store.metadata.contact || '',
          managerName: store.metadata.managerName || '',
          phone: store.metadata.phone || '',
          email: store.metadata.email || ''
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStore) {
      dbStores.update(editingStore.id, {
        ...formData,
        ownerId: editingStore.ownerId
      });
    } else {
      dbStores.create({
        ...formData,
        ownerId: currentUser?.uid || ''
      });
    }
    loadStores();
    handleCloseModal();
  };
  const handleDelete = (id: string) => {
    if (
    window.confirm(
      'Are you sure you want to delete this store? This will also delete all associated racks and items.'
    ))
    {
      dbStores.delete(id);
      loadStores();
    }
  };
  const filteredStores = stores.filter(
    (s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          <p className="text-gray-500">
            Manage your retail locations and warehouses
          </p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2">

          <PlusIcon className="h-4 w-4" />
          Add Store
        </Button>
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search stores by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9" />

      </div>

      {filteredStores.length === 0 ?
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
          <StoreIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No stores found</h3>
          <p className="text-gray-500 mt-1">
            Get started by creating a new store location.
          </p>
          <Button
          onClick={() => handleOpenModal()}
          className="mt-4"
          variant="secondary">

            Add Your First Store
          </Button>
        </div> :

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) =>
        <Card
          key={store.id}
          className="flex flex-col h-full hover:shadow-md transition-shadow">

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <StoreIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{store.name}</CardTitle>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPinIcon className="h-3 w-3" />
                        {store.location}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {store.description}
                </p>

                <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
                  {store.metadata.managerName &&
              <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span>{store.metadata.managerName}</span>
                    </div>
              }
                  {store.metadata.phone &&
              <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span>{store.metadata.phone}</span>
                    </div>
              }
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 justify-end gap-2 py-3">
                <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenModal(store)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">

                  <EditIcon className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(store.id)}
              className="text-red-600 hover:text-red-800 hover:bg-red-50">

                  <TrashIcon className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
        )}
        </div>
      }

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingStore ? 'Edit Store' : 'Add New Store'}
        maxWidth="2xl">

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                Basic Information
              </h3>
              <Input
                label="Store Name"
                value={formData.name}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value
                })
                }
                required />

              <Input
                label="Location (City/Region)"
                value={formData.location}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  location: e.target.value
                })
                }
                required />

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value
                  })
                  } />

              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                Store Attributes
              </h3>
              <Input
                label="Full Address"
                value={formData.metadata.address}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    address: e.target.value
                  }
                })
                } />

              <Input
                label="Manager Name"
                value={formData.metadata.managerName}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    managerName: e.target.value
                  }
                })
                } />

              <Input
                label="Phone Number"
                value={formData.metadata.phone}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    phone: e.target.value
                  }
                })
                } />

              <Input
                label="Contact Email"
                type="email"
                value={formData.metadata.email}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    email: e.target.value
                  }
                })
                } />

            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}>

              Cancel
            </Button>
            <Button type="submit">
              {editingStore ? 'Save Changes' : 'Create Store'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>);

};