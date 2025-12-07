/**
 * Main layout component with navigation
 */

import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Receipt, 
  Wallet,
  BarChart3, 
  LogOut, 
  User,
  Menu,
  X,
  Repeat
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '.';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Fixed Expenses', href: '/fixed-expenses', icon: Repeat },
    { name: 'Budget', href: '/budget', icon: Wallet },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Guita</h1>
              <ThemeToggle />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isCurrentPath(item.href)
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-l-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-md transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Guita</h1>
              <ThemeToggle />
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isCurrentPath(item.href)
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-l-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-md transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {navigation.find(item => isCurrentPath(item.href))?.name || 'Guita'}
              </h1>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
