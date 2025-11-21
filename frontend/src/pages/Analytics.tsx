/**
 * Analytics page component
 */

import React from 'react';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100 sm:text-3xl sm:truncate">
            Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Analyze your spending patterns and trends
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-md border border-slate-200 dark:border-slate-700">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
            Spending Analytics
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            View charts and insights about your expenses
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;