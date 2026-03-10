import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboardIcon,
  StoreIcon,
  UsersIcon,
  LogOutIcon,
  PackageIcon,
  MenuIcon,
  XIcon } from
'lucide-react';
export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboardIcon,
    roles: ['super-admin', 'admin', 'user']
  },
  {
    name: 'Stores',
    path: '/stores',
    icon: StoreIcon,
    roles: ['super-admin', 'admin']
  },
  {
    name: 'Inventory',
    path: '/inventory',
    icon: PackageIcon,
    roles: ['super-admin', 'admin', 'user']
  },
  {
    name: 'Users',
    path: '/users',
    icon: UsersIcon,
    roles: ['super-admin', 'admin']
  }];

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <PackageIcon className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg">StoreSync</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">

          {isMobileMenuOpen ?
          <XIcon className="h-6 w-6" /> :

          <MenuIcon className="h-6 w-6" />
          }
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 
        fixed md:sticky top-0 left-0 z-10 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out
      `}>

        <div className="p-6 hidden md:flex items-center gap-2 border-b border-gray-100">
          <PackageIcon className="h-8 w-8 text-blue-600" />
          <span className="font-bold text-xl tracking-tight">StoreSync</span>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role.replace('-', ' ')}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive =
            location.pathname === item.path ||
            item.path !== '/' && location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `}>

                <item.icon
                  className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />

                {item.name}
              </Link>);

          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">

            <LogOutIcon className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen &&
      <div
        className="fixed inset-0 bg-black/20 z-0 md:hidden"
        onClick={() => setIsMobileMenuOpen(false)} />

      }
    </div>);

};