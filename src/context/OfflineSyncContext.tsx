import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from './ToastContext';

interface OfflineAction {
  id: string;
  type: 'create-session' | 'send-message' | 'delete-session';
  payload: any;
  timestamp: number;
}

interface OfflineSyncContextType {
  isOnline: boolean;
  syncQueue: OfflineAction[];
  enqueueAction: (type: OfflineAction['type'], payload: any) => void;
  syncOfflineDataBase: () => Promise<void>;
  cacheData: (key: string, data: any) => void;
  getCachedData: <T>(key: string, fallback: T) => T;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<OfflineAction[]>([]);
  const { showSuccess, showWarning, showError, showInfo } = useToast();

  // Load pending queue from localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem('studynet_sync_queue');
    if (savedQueue) {
      try {
        setSyncQueue(JSON.parse(savedQueue));
      } catch (e) {
        setSyncQueue([]);
      }
    }
  }, []);

  // Update localStorage when queue changes
  const updateQueueState = (newQueue: OfflineAction[]) => {
    setSyncQueue(newQueue);
    localStorage.setItem('studynet_sync_queue', JSON.stringify(newQueue));
  };

  // Cache utilities
  const cacheData = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(`studynet_cache_${key}`, JSON.stringify(data));
    } catch (e) {
      // Ignored
    }
  }, []);

  const getCachedData = useCallback(<T,>(key: string, fallback: T): T => {
    try {
      const data = localStorage.getItem(`studynet_cache_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }, []);

  // Enqueue actions to run when online
  const enqueueAction = useCallback((type: OfflineAction['type'], payload: any) => {
    const newAction: OfflineAction = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      payload,
      timestamp: Date.now()
    };
    setSyncQueue((prev) => {
      const updated = [...prev, newAction];
      localStorage.setItem('studynet_sync_queue', JSON.stringify(updated));
      return updated;
    });
    showWarning(`Offline: queued '${type}' action to sync later.`);
  }, [showWarning]);

  // Sync back to server
  const syncOfflineDataBase = useCallback(async () => {
    const savedQueue = localStorage.getItem('studynet_sync_queue');
    if (!savedQueue) return;

    let actions: OfflineAction[] = [];
    try {
      actions = JSON.parse(savedQueue);
    } catch (e) {
      return;
    }

    if (actions.length === 0) return;

    showInfo(`Synchronizing ${actions.length} offline actions with campus register...`, 3000);
    const failedActions: OfflineAction[] = [];

    for (const action of actions) {
      try {
        if (action.type === 'create-session') {
          await api.createSession(action.payload.title);
        } else if (action.type === 'delete-session') {
          await api.deleteSession(action.payload.sessionId);
        } else if (action.type === 'send-message') {
          await api.sendMessage(
            action.payload.sessionId,
            action.payload.content,
            action.payload.attachedImage,
            action.payload.attachedFile,
            action.payload.enableWebSearch
          );
        }
      } catch (err) {
        // Keep in queue if it's a transient connection failure, else discard to prevent infinite failure loops
        if (err instanceof TypeError && err.message.includes('fetch')) {
          failedActions.push(action);
        }
      }
    }

    updateQueueState(failedActions);

    if (failedActions.length === 0) {
      showSuccess('All offline work has been fully synchronized with StudyNet!');
      // Force refresh page context or trigger reload if on corresponding view
      window.dispatchEvent(new Event('studynet_sync_complete'));
    } else {
      showError(`Synced completed but ${failedActions.length} actions failed.`);
    }
  }, [showSuccess, showError, showInfo]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showSuccess('Network connection restored. Back online!');
      syncOfflineDataBase();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showWarning('Connection lost. Switching to Offline Mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (navigator.onLine && syncQueue.length > 0) {
      syncOfflineDataBase();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showSuccess, showWarning, syncOfflineDataBase, syncQueue.length]);

  return (
    <OfflineSyncContext.Provider value={{
      isOnline,
      syncQueue,
      enqueueAction,
      syncOfflineDataBase,
      cacheData,
      getCachedData
    }}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
