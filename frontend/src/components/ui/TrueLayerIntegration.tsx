/**
 * TrueLayer Integration Component
 * Simple, clean UI for bank account integration
 */

import React, { useState, useEffect } from 'react';
import { Button, Card } from '../index';
import { apiService } from '../../services/api';
import { Link2, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react';

interface TrueLayerIntegrationProps {
  onSyncComplete?: () => void;
}

const TrueLayerIntegration: React.FC<TrueLayerIntegrationProps> = ({ onSyncComplete }) => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await apiService.getTrueLayerStatus();
      setConnected(status.connected);
      
      if (status.connected) {
        await loadAccounts();
      }
    } catch (err: any) {
      // Only show error if it's a real API error, not network issues
      if (err?.message && !err.message.includes('Failed to fetch')) {
        console.error('Error checking TrueLayer status:', err);
        setError(err?.message || 'Failed to check connection status');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      // Load accounts that were connected during OAuth
      // This returns the user's connected bank accounts, NOT a list of available banks
      // Bank selection happens during OAuth flow on TrueLayer's side
      const response = await apiService.getTrueLayerAccounts();
      setAccounts(response.accounts || []);
    } catch (err: any) {
      console.error('Error loading accounts:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get OAuth link from backend
      // The backend generates the URL with state=user_id
      const response = await apiService.getTrueLayerAuthLink();
      
      // Redirect user to TrueLayer OAuth page
      // IMPORTANT: 
      // - User will log in at TrueLayer
      // - User will select their bank at TrueLayer (sandbox or live)
      // - TrueLayer handles bank selection internally - we don't call providers API
      // - After authorization, TrueLayer redirects to backend callback
      // - Backend exchanges code for tokens and saves them
      // - Frontend never calls login-api.truelayer-sandbox.com/providers
      window.location.href = response.auth_url;
    } catch (err: any) {
      console.error('Error getting auth link:', err);
      setError(err?.message || 'Failed to get authorization link');
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const result = await apiService.syncTrueLayerTransactions();
      
      if (result.synced > 0) {
        // Trigger refresh of expenses
        if (onSyncComplete) {
          onSyncComplete();
        }
        // Show success message
        setError(null);
      }
    } catch (err: any) {
      console.error('Error syncing transactions:', err);
      setError(err?.message || 'Failed to sync transactions');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your bank account?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.disconnectTrueLayer();
      setConnected(false);
      setAccounts([]);
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      setError(err?.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !connected) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bank Account Integration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Connect your bank account to automatically import transactions
          </p>
        </div>
        {connected ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <XCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Not Connected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!connected ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your bank account securely through TrueLayer to automatically import and categorize your transactions.
          </p>
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Connect Bank Account
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connected Accounts:
              </p>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.account_id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {account.display_name || account.account_id}
                    </p>
                    {account.account_type && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {account.account_type}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Transactions
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDisconnect}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TrueLayerIntegration;

