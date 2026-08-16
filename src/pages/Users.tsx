import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbUsers, dbStores, SUPER_ADMIN_EMAIL } from '../lib/db';
import { User, Role, Store } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../components/ui/Table';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserXIcon
} from 'lucide-react';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as Role,
    assignedStores: [] as string[]
  });

  useEffect(() => {
    // Subscribe to real-time users from Firebase Realtime Database
    const unsubscribeUsers = dbUsers.subscribe((userList) => {
      setUsers(userList);
    });

    const unsubscribeStores = dbStores.subscribe((storeList) => {
      setStores(storeList);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeStores();
    };
  }, []);

  const handleOpenModal = (targetUser?: User) => {
    if (targetUser) {
      setEditingUser(targetUser);
      setFormData({
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        assignedStores: targetUser.assignedStores || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'user',
        assignedStores: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingUser) {
        await dbUsers.update(editingUser.uid, {
          name: formData.name,
          role: formData.role,
          assignedStores: formData.assignedStores
        });
      } else {
        const cleanEmail = formData.email.toLowerCase().trim();
        const newUid = `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
        await dbUsers.saveUser({
          uid: newUid,
          email: cleanEmail,
          name: formData.name,
          role: cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() ? 'super-admin' : formData.role,
          createdAt: Date.now(),
          assignedStores: formData.assignedStores
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save user:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (uid: string, targetEmail: string) => {
    if (targetEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('The primary Super Admin cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user ${targetEmail}?`)) {
      await dbUsers.delete(uid);
    }
  };

  const handleToggleStoreAssignment = (storeId: string) => {
    const currentAssigned = [...formData.assignedStores];
    const index = currentAssigned.indexOf(storeId);
    if (index > -1) {
      currentAssigned.splice(index, 1);
    } else {
      currentAssigned.push(storeId);
    }
    setFormData({ ...formData, assignedStores: currentAssigned });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Super Admin role options to assign
  const roleOptions = [
    { value: 'user', label: 'User (Store Staff)' },
    { value: 'admin', label: 'Admin (Store Manager)' }
  ];

  if (currentUser?.role === 'super-admin') {
    roleOptions.push({ value: 'super-admin', label: 'Super Admin (System Owner)' });
  }

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'super-admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheckIcon className="h-3.5 w-3.5" /> Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <UserCheckIcon className="h-3.5 w-3.5" /> Admin
          </span>
        );
      case 'user':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            User
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            User & Role Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Superadmin panel: View all users, change roles to Admin or User, and assign store permissions.
          </p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 shadow-sm"
        >
          <PlusIcon className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Total: {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Profile</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Stores</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-gray-500"
                >
                  <UserXIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  No users found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const isTargetSuperAdmin = u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                return (
                  <TableRow key={u.uid} className="hover:bg-slate-50/70">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            u.role === 'super-admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'admin'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {u.name}
                            {isTargetSuperAdmin && (
                              <Badge variant="default" className="text-[10px] bg-purple-600 text-white">
                                Primary Owner
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{getRoleBadge(u.role)}</TableCell>

                    <TableCell>
                      {u.role === 'super-admin' ? (
                        <span className="text-xs text-gray-500 italic">
                          All Stores (Global Access)
                        </span>
                      ) : (u.assignedStores || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(u.assignedStores || []).map((sId) => {
                            const storeName =
                              stores.find((s) => s.id === sId)?.name || sId;
                            return (
                              <span
                                key={sId}
                                className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                              >
                                {storeName}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No stores assigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(u)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          title="Edit User & Change Role"
                        >
                          <EditIcon className="h-4 w-4 mr-1" /> Edit
                        </Button>

                        {!isTargetSuperAdmin && currentUser?.uid !== u.uid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(u.uid, u.email)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Delete User"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Add New User'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. Jane Doe"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={Boolean(editingUser)}
            placeholder="user@example.com"
          />

          <div>
            <Select
              label="Role (Assign User or Admin)"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as Role })
              }
              options={roleOptions}
              required
              disabled={
                editingUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
              }
            />
            {editingUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
              <p className="text-xs text-purple-700 mt-1">
                Primary Super Admin role cannot be downgraded.
              </p>
            )}
          </div>

          {formData.role !== 'super-admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Assign Store Permissions
              </label>
              {stores.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No stores available.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                  {stores.map((store) => {
                    const isChecked = formData.assignedStores.includes(store.id);
                    return (
                      <label
                        key={store.id}
                        className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStoreAssignment(store.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{store.name}</span>
                        <span className="text-xs text-gray-400">({store.location})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};