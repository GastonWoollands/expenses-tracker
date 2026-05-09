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
  Repeat,
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

  const isCurrentPath = (path: string) => location.pathname === path;

  const navButton = (item: (typeof navigation)[0], onNavigate: () => void) => {
    const Icon = item.icon;
    const active = isCurrentPath(item.href);
    return (
      <button
        key={item.name}
        onClick={onNavigate}
        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-[var(--radius-control)] transition-colors duration-200 ${
          active
            ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] border-l-2 border-[var(--nav-active-border)] pl-[10px]'
            : 'text-[var(--nav-inactive-text)] hover:bg-[var(--nav-inactive-hover-bg)] hover:text-fg border-l-2 border-transparent pl-[10px]'
        }`}
      >
        <Icon className="mr-3 h-5 w-5 shrink-0 opacity-80" />
        {item.name}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-surface text-fg">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-surface-raised border-r border-border shadow-[var(--shadow-card)]">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-fg tracking-tight">Guita</h1>
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="text-fg-muted hover:text-fg transition-colors p-1 rounded-[var(--radius-control)]"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">{navigation.map((item) => navButton(item, () => {
            navigate(item.href);
            setSidebarOpen(false);
          }))}</nav>
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-fg-muted" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-fg truncate">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-[var(--nav-inactive-text)] hover:bg-[var(--nav-inactive-hover-bg)] hover:text-fg rounded-[var(--radius-control)] transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-surface-raised border-r border-border">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-fg tracking-tight">Guita</h1>
              <ThemeToggle />
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => navButton(item, () => navigate(item.href)))}
          </nav>
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-fg-muted" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-fg truncate">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-[var(--nav-inactive-text)] hover:bg-[var(--nav-inactive-hover-bg)] hover:text-fg rounded-[var(--radius-control)] transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 bg-surface-raised border-b border-border shadow-[var(--shadow-card)] lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-fg hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring lg:hidden transition-colors rounded-[var(--radius-control)]"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-center px-4 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-fg truncate">
                {navigation.find((item) => isCurrentPath(item.href))?.name || 'Guita'}
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
