import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbUsers } from '../lib/mockDb';
import { User, Role } from '../types';
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
  TableCell } from
'../components/ui/Table';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  ShieldIcon } from
'lucide-react';
export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as Role
  });
  const loadUsers = () => {
    let allUsers = dbUsers.getAll();
    // Admins can't see super-admins
    if (currentUser?.role === 'admin') {
      allUsers = allUsers.filter((u) => u.role !== 'super-admin');
    }
    setUsers(allUsers);
  };
  useEffect(() => {
    loadUsers();
  }, [currentUser]);
  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'user'
      });
    }
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      dbUsers.update(editingUser.uid, formData);
    } else {
      dbUsers.create({
        ...formData,
        assignedStores: []
      });
    }
    loadUsers();
    handleCloseModal();
  };
  const handleDelete = (uid: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      dbUsers.delete(uid);
      loadUsers();
    }
  };
  const filteredUsers = users.filter(
    (u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const roleOptions = [
  {
    value: 'user',
    label: 'User'
  },
  {
    value: 'admin',
    label: 'Admin'
  }];

  // Only super-admin can assign super-admin role
  if (currentUser?.role === 'super-admin') {
    roleOptions.push({
      value: 'super-admin',
      label: 'Super Admin'
    });
  }
  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'super-admin':
        return 'danger';
      case 'admin':
        return 'warning';
      case 'user':
        return 'info';
      default:
        return 'default';
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage users, roles, and permissions</p>
        </div>

        {currentUser?.role === 'super-admin' &&
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2">

            <PlusIcon className="h-4 w-4" />
            Add User
          </Button>
        }
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9" />

          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ?
            <TableRow>
                <TableCell
                colSpan={4}
                className="text-center py-8 text-gray-500">

                  No users found matching your search.
                </TableCell>
              </TableRow> :

            filteredUsers.map((user) =>
            <TableRow key={user.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                  variant={getRoleBadgeVariant(user.role)}
                  className="capitalize flex w-fit items-center gap-1">

                      {user.role === 'super-admin' &&
                  <ShieldIcon className="h-3 w-3" />
                  }
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Logic for who can edit who */}
                      {(currentUser?.role === 'super-admin' ||
                  currentUser?.role === 'admin' &&
                  user.role === 'user') &&
                  <>
                          <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(user)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">

                            <EditIcon className="h-4 w-4" />
                          </Button>

                          {/* Don't allow deleting yourself */}
                          {currentUser?.uid !== user.uid &&
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.uid)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50">

                              <TrashIcon className="h-4 w-4" />
                            </Button>
                    }
                        </>
                  }
                    </div>
                  </TableCell>
                </TableRow>
            )
            }
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Add New User'}>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) =>
            setFormData({
              ...formData,
              name: e.target.value
            })
            }
            required />


          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value
            })
            }
            required
            disabled={!!editingUser} // Don't allow changing email for existing users
          />

          {/* Only super-admin can change roles, or admin creating a new user (which defaults to user) */}
          {currentUser?.role === 'super-admin' &&
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) =>
            setFormData({
              ...formData,
              role: e.target.value as Role
            })
            }
            options={roleOptions}
            required
            disabled={editingUser?.uid === currentUser?.uid} // Can't change own role
          />
          }

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}>

              Cancel
            </Button>
            <Button type="submit">
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>);

};