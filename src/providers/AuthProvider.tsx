'use client';

import React, { useEffect, useState } from 'react';
import { ensureAuth } from '@/lib/firebase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await ensureAuth();
        setIsAuthReady(true);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Auth initialization failed');
      }
    };

    initAuth();
  }, []);

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-8">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
