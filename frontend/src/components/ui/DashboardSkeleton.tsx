/**
 * Dashboard loading placeholders (theme-aware)
 */

import React from 'react';
import { ResponsiveContainer } from '..';

const Bar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-md bg-surface-muted animate-pulse ${className}`} aria-hidden />
);

const DashboardSkeleton: React.FC = () => {
  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="space-y-10 py-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2 w-full max-w-md">
            <Bar className="h-8 w-40" />
            <Bar className="h-4 w-full max-w-sm" />
          </div>
          <Bar className="h-10 w-full sm:w-36" />
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface-raised p-6 md:p-8 shadow-[var(--shadow-card)] space-y-6">
          <Bar className="h-5 w-48" />
          <div className="space-y-3">
            <Bar className="h-3 w-56" />
            <Bar className="h-12 w-64 max-w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Bar className="h-3 w-32" />
              <Bar className="h-8 w-44" />
            </div>
            <div className="space-y-2">
              <Bar className="h-3 w-32" />
              <Bar className="h-8 w-44" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-2 xl:gap-12">
          <div className="flex flex-col gap-2">
            <Bar className="h-5 w-48" />
            <div className="flex min-h-[3.75rem] flex-col gap-1">
              <Bar className="h-3 w-full max-w-md" />
              <Bar className="h-3 w-full max-w-sm" />
            </div>
            <div className="mt-1 flex h-[max(10rem,min(28rem,50svh))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-raised p-3 shadow-[var(--shadow-card)]">
              <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Bar key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
            <Bar className="h-4 w-56" />
          </div>
          <div className="flex flex-col gap-2">
            <Bar className="h-5 w-40" />
            <div className="flex min-h-[3.75rem] flex-col gap-1">
              <Bar className="h-3 w-full max-w-md" />
              <Bar className="h-3 w-full max-w-sm" />
            </div>
            <div className="mt-1 flex h-[max(10rem,min(28rem,50svh))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-raised p-3 shadow-[var(--shadow-card)]">
              <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Bar key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
            <Bar className="h-4 w-64" />
          </div>
        </div>

        <div className="space-y-4">
          <Bar className="h-5 w-40" />
          <Bar className="h-48 w-full rounded-[var(--radius-card)]" />
        </div>
      </div>
      <p className="text-center text-sm text-fg-muted mt-8">Loading dashboard…</p>
    </ResponsiveContainer>
  );
};

export default DashboardSkeleton;
