import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { dbStores, dbUsers, dbRacks, dbItems } from '../lib/db';
import {
  StoreIcon,
  UsersIcon,
  PackageIcon,
  LayersIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SparklesIcon
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    stores: 0,
    users: 0,
    racks: 0,
    items: 0
  });

  useEffect(() => {
    // Subscribe to all collections in realtime
    const unsubStores = dbStores.subscribe((stores) => {
      let visibleStores = stores;
      if (user?.role === 'user') {
        visibleStores = stores.filter((s) => user.assignedStores?.includes(s.id));
      }
      setStats((prev) => ({ ...prev, stores: visibleStores.length }));
    });

    const unsubUsers = dbUsers.subscribe((users) => {
      if (user?.role === 'super-admin') {
        setStats((prev) => ({ ...prev, users: users.length }));
      } else {
        setStats((prev) => ({ ...prev, users: 0 }));
      }
    });

    const unsubRacks = dbRacks.subscribe((racks) => {
      setStats((prev) => ({ ...prev, racks: racks.length }));
    });

    const unsubItems = dbItems.subscribe((items) => {
      setStats((prev) => ({ ...prev, items: items.length }));
    });

    return () => {
      unsubStores();
      unsubUsers();
      unsubRacks();
      unsubItems();
    };
  }, [user]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    subtitle
  }: {
    title: string;
    value: number;
    icon: any;
    colorClass: string;
    subtitle?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow border-gray-200">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-2xl ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              {user?.role === 'super-admin' ? 'Super Admin Portal' : user?.role === 'admin' ? 'Store Manager' : 'Staff Portal'}
            </span>
            <span className="text-xs text-blue-200">• Realtime Database Active</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100 text-sm mt-0.5">
            Monitor real-time store stock, configure rack dimensions, and manage inventory slots.
          </p>
        </div>

        {user?.role === 'super-admin' && (
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
            <ShieldCheckIcon className="h-5 w-5 text-amber-300" />
            <div className="text-xs">
              <p className="font-semibold text-white">Full System Access</p>
              <p className="text-blue-200">Manage user roles & permissions</p>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Stores"
          value={stats.stores}
          icon={StoreIcon}
          colorClass="bg-blue-100 text-blue-600"
          subtitle="Active retail & warehouse hubs"
        />

        {/* Total Users - STRICTLY visible only to Super-Admin */}
        {user?.role === 'super-admin' && (
          <StatCard
            title="Total Users"
            value={stats.users}
            icon={UsersIcon}
            colorClass="bg-purple-100 text-purple-600"
            subtitle="Admins and store users"
          />
        )}

        <StatCard
          title="Total Racks"
          value={stats.racks}
          icon={LayersIcon}
          colorClass="bg-indigo-100 text-indigo-600"
          subtitle="Configured storage grids"
        />

        <StatCard
          title="Inventory Items"
          value={stats.items}
          icon={PackageIcon}
          colorClass="bg-amber-100 text-amber-600"
          subtitle="Cataloged in rack slots"
        />
      </div>

      {/* Quick Actions & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base flex items-center gap-2 text-gray-900">
              <SparklesIcon className="h-5 w-5 text-blue-600" />
              Quick Navigation & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/inventory')}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <PackageIcon className="h-5 w-5" />
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="mt-3">
                  <span className="font-semibold text-gray-900 block text-sm">
                    Manage Inventory
                  </span>
                  <span className="text-xs text-gray-500">
                    View rack slot grids & search items
                  </span>
                </div>
              </button>

              {user?.role !== 'user' && (
                <button
                  onClick={() => navigate('/stores')}
                  className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <StoreIcon className="h-5 w-5" />
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="mt-3">
                    <span className="font-semibold text-gray-900 block text-sm">
                      Store Locations
                    </span>
                    <span className="text-xs text-gray-500">
                      Configure store details & contacts
                    </span>
                  </div>
                </button>
              )}

              {user?.role === 'super-admin' && (
                <button
                  onClick={() => navigate('/users')}
                  className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex flex-col justify-between group sm:col-span-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <UsersIcon className="h-5 w-5" />
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="mt-3">
                    <span className="font-semibold text-gray-900 block text-sm">
                      User & Role Management
                    </span>
                    <span className="text-xs text-gray-500">
                      Change user roles to Admin or User and assign store permissions
                    </span>
                  </div>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base flex items-center gap-2 text-gray-900">
              <TrendingUpIcon className="h-5 w-5 text-indigo-600" />
              System Status & Features
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 mt-1.5" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Firebase Realtime Database Connected
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Live bidirectional synchronization active across all stores, racks, and items.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Multi-Item Rack Slot Grid Enabled
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Racks now support placing multiple items in the same (Row, Col) coordinate with count badges and slot inspection modals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500 mt-1.5" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Dynamic Search & Multi-Filter Active
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Instant item, category, and rack filtering with visual highlight feedback on rack grids.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};