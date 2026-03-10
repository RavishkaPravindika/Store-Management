import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Store, User, Rack, Item } from '../types';
import { dbStores, dbUsers, dbRacks, dbItems } from '../lib/mockDb';
import {
  StoreIcon,
  UsersIcon,
  PackageIcon,
  LayersIcon,
  TrendingUpIcon } from
'lucide-react';
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    stores: 0,
    users: 0,
    racks: 0,
    items: 0
  });
  useEffect(() => {
    // Load stats based on role
    const loadStats = () => {
      if (user?.role === 'super-admin') {
        setStats({
          stores: dbStores.getAll().length,
          users: dbUsers.getAll().length,
          racks: dbRacks.getAll().length,
          items: dbItems.getAll().length
        });
      } else if (user?.role === 'admin') {
        // Admins see all stores for now, but in a real app would be filtered
        setStats({
          stores: dbStores.getAll().length,
          users: dbUsers.getAll().filter((u) => u.role === 'user').length,
          racks: dbRacks.getAll().length,
          items: dbItems.getAll().length
        });
      } else {
        // Users only see their assigned stores
        const assignedStores = user?.assignedStores || [];
        const userStores = dbStores.
        getAll().
        filter((s) => assignedStores.includes(s.id));
        const storeIds = userStores.map((s) => s.id);
        const userRacks = dbRacks.
        getAll().
        filter((r) => storeIds.includes(r.storeId));
        const rackIds = userRacks.map((r) => r.id);
        const userItems = dbItems.
        getAll().
        filter((i) => rackIds.includes(i.rackId));
        setStats({
          stores: userStores.length,
          users: 0,
          racks: userRacks.length,
          items: userItems.length
        });
      }
    };
    loadStats();
  }, [user]);
  const StatCard = ({ title, value, icon: Icon, colorClass }: any) =>
  <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-4 rounded-full ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Stores"
          value={stats.stores}
          icon={StoreIcon}
          colorClass="bg-blue-100 text-blue-600" />

        {(user?.role === 'super-admin' || user?.role === 'admin') &&
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={UsersIcon}
          colorClass="bg-green-100 text-green-600" />

        }
        <StatCard
          title="Total Racks"
          value={stats.racks}
          icon={LayersIcon}
          colorClass="bg-purple-100 text-purple-600" />

        <StatCard
          title="Total Items"
          value={stats.items}
          icon={PackageIcon}
          colorClass="bg-amber-100 text-amber-600" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-gray-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Activity feed will appear here</p>
              <p className="text-sm mt-2">
                Track item movements and store updates
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5 text-gray-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {user?.role !== 'user' &&
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex flex-col gap-2">
                  <StoreIcon className="h-6 w-6 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    Add New Store
                  </span>
                </button>
              }
              {user?.role === 'super-admin' &&
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex flex-col gap-2">
                  <UsersIcon className="h-6 w-6 text-green-600" />
                  <span className="font-medium text-gray-900">
                    Manage Roles
                  </span>
                </button>
              }
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex flex-col gap-2">
                <PackageIcon className="h-6 w-6 text-amber-600" />
                <span className="font-medium text-gray-900">Add Inventory</span>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex flex-col gap-2">
                <LayersIcon className="h-6 w-6 text-purple-600" />
                <span className="font-medium text-gray-900">
                  Configure Racks
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

};