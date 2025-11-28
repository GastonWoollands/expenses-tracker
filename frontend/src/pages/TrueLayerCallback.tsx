/**
 * TrueLayer OAuth Callback Handler
 * Handles the redirect from TrueLayer after user authorization
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, Heading, Card } from '../components';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const TrueLayerCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const handleCallback = async () => {
      // Backend already processed the code and redirected here with success/error
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authorization failed: ${decodeURIComponent(error)}`);
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      if (success === 'true') {
        setStatus('success');
        setMessage('Bank account connected successfully!');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // If neither success nor error, show loading (shouldn't happen normally)
      setStatus('loading');
      setMessage('Processing authorization...');
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-spin" />
              <Heading level={2} className="mb-2">
                Connecting...
              </Heading>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
              <Heading level={2} className="mb-2 text-green-600 dark:text-green-400">
                Success!
              </Heading>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Redirecting to dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600 dark:text-red-400" />
              <Heading level={2} className="mb-2 text-red-600 dark:text-red-400">
                Error
              </Heading>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Redirecting to dashboard...
              </p>
            </>
          )}
        </Card>
      </div>
    </ResponsiveContainer>
  );
};

export default TrueLayerCallback;

