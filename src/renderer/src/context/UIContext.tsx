
import * as React from 'react';

import { User } from '../../types';

// Define the shape of the toast state
interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Define the shape of the context
interface UIContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  handleLogout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  isAddDoctorModalOpen: boolean;
  isAddNoteModalOpen: boolean;
  isAddPaymentModalOpen: boolean;
  isAuthModalOpen: boolean;
  isConfirmCompletionModalOpen: boolean;
  isEditOrderModalOpen: boolean;
  isEmailDraftModalOpen: boolean;
  isDeleteReportModalOpen: boolean;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  handleMarkNotificationsAsRead: () => Promise<void>;
  handleClearAllNotifications: () => Promise<void>;
  handleDeleteNotification: (id: string) => Promise<void>;
  toast: ToastState;
  isDatabaseMaintenance: boolean; // New state for database maintenance
  openAddDoctorModal: () => void;
  closeAddDoctorModal: () => void;
  openAddNoteModal: () => void;
  closeAddNoteModal: () => void;
  openAddPaymentModal: () => void;
  closeAddPaymentModal: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openConfirmCompletionModal: () => void;
  closeConfirmCompletionModal: () => void;
  openEditOrderModal: () => void;
  closeEditOrderModal: () => void;
  openEmailDraftModal: () => void;
  closeEmailDraftModal: () => void;
  openDeleteReportModal: () => void;
  closeDeleteReportModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

// Create the context
const UIContext = React.createContext<UIContextType | undefined>(undefined);

// Create a provider component
interface UIProviderProps {
  children: React.ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isAddDoctorModalOpen, setAddDoctorModalOpen] = React.useState(false);
  const [isAddNoteModalOpen, setAddNoteModalOpen] = React.useState(false);
  const [isAddPaymentModalOpen, setAddPaymentModalOpen] = React.useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = React.useState(true); // Default to open
  const [isConfirmCompletionModalOpen, setConfirmCompletionModalOpen] = React.useState(false);
  const [isEditOrderModalOpen, setEditOrderModalOpen] = React.useState(false);
  const [isEmailDraftModalOpen, setEmailDraftModalOpen] = React.useState(false);
  const [isDeleteReportModalOpen, setDeleteReportModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState>({ show: false, message: '', type: 'info' });
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isDatabaseMaintenance, setIsDatabaseMaintenance] = React.useState(false); // New state

  const API_URL = '/api';

  const hideToast = React.useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      hideToast();
    }, 3000);
  }, [hideToast]);

  const clientSideLogout = React.useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('token');
  }, [setCurrentUser]);

  const authFetch = React.useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) { // Unauthorized (e.g., bad token)
      clientSideLogout();
      showToast('Sesión expirada. Por favor, inicia sesión de nuevo.', 'error');
    }
    return response;
  }, [showToast, clientSideLogout]);

  const checkDatabaseStatus = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/status`); // Use plain fetch, not authFetch
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setIsDatabaseMaintenance(!data.databaseConnected);
    } catch (error) {
      console.error("Error checking database status:", error);
      setIsDatabaseMaintenance(true); // Assume maintenance if check fails
    }
  }, []);

  React.useEffect(() => {
    checkDatabaseStatus(); // Initial check
    const interval = setInterval(checkDatabaseStatus, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [checkDatabaseStatus]);

  const handleLogout = React.useCallback(async () => {
    try {
      await authFetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error("Error during API logout:", error);
    } finally {
      clientSideLogout();
      showToast('Sesión cerrada.', 'info'); // Changed type to 'info' for consistency
    }
  }, [clientSideLogout, showToast, authFetch]);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const fetchedNotifications = await authFetch(`/api/notifications`).then(res => res.json());
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [authFetch]);

  const handleMarkNotificationsAsRead = React.useCallback(async () => {
    try {
      await authFetch(`/api/notifications/mark-all-read`, { method: 'PUT' });
      fetchNotifications(); // Refresh notifications list
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }, [fetchNotifications, authFetch]);

  const handleClearAllNotifications = React.useCallback(async () => {
    try {
      await authFetch(`/api/notifications`, { method: 'DELETE' });
      fetchNotifications(); // Refresh to show empty list
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, [fetchNotifications, authFetch]);

  const handleDeleteNotification = React.useCallback(async (id: string) => {
    try {
      await authFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications(); // Refresh notifications list
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, [fetchNotifications, authFetch]);

  const openAddDoctorModal = React.useCallback(() => setAddDoctorModalOpen(true), []);
  const closeAddDoctorModal = React.useCallback(() => setAddDoctorModalOpen(false), []);

  const openAddNoteModal = React.useCallback(() => setAddNoteModalOpen(true), []);
  const closeAddNoteModal = React.useCallback(() => setAddNoteModalOpen(false), []);

  const openAddPaymentModal = React.useCallback(() => setAddPaymentModalOpen(true), []);
  const closeAddPaymentModal = React.useCallback(() => setAddPaymentModalOpen(false), []);

  const openAuthModal = React.useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = React.useCallback(() => {
    if (currentUser) { // Only close auth modal if a user is logged in
      setAuthModalOpen(false);
    }
  }, [currentUser]);

  const openConfirmCompletionModal = React.useCallback(() => setConfirmCompletionModalOpen(true), []);
  const closeConfirmCompletionModal = React.useCallback(() => setConfirmCompletionModalOpen(false), []);

  const openEditOrderModal = React.useCallback(() => setEditOrderModalOpen(true), []);
  const closeEditOrderModal = React.useCallback(() => setEditOrderModalOpen(false), []);

  const openEmailDraftModal = React.useCallback(() => setEmailDraftModalOpen(true), []);
  const closeEmailDraftModal = React.useCallback(() => setEmailDraftModalOpen(false), []);

  const openDeleteReportModal = React.useCallback(() => setDeleteReportModalOpen(true), []);
  const closeDeleteReportModal = React.useCallback(() => setDeleteReportModalOpen(false), []);

  const value = {
    currentUser,
    setCurrentUser,
    handleLogout,
    authFetch,
    isAddDoctorModalOpen,
    isAddNoteModalOpen,
    isAddPaymentModalOpen,
    isAuthModalOpen,
    isConfirmCompletionModalOpen,
    isEditOrderModalOpen,
    isEmailDraftModalOpen,
    isDeleteReportModalOpen,
    toast,
    notifications,
    fetchNotifications,
    handleMarkNotificationsAsRead,
    handleClearAllNotifications,
    handleDeleteNotification,
    isDatabaseMaintenance, // Include new state
    openAddDoctorModal,
    closeAddDoctorModal,
    openAddNoteModal,
    closeAddNoteModal,
    openAddPaymentModal,
    closeAddPaymentModal,
    openAuthModal,
    closeAuthModal,
    openConfirmCompletionModal,
    closeConfirmCompletionModal,
    openEditOrderModal,
    closeEditOrderModal,
    openEmailDraftModal,
    closeEmailDraftModal,
    openDeleteReportModal,
    closeDeleteReportModal,
    showToast,
    hideToast,
  };

  return (
    <UIContext.Provider value={value}>
      <React.Fragment>{children}</React.Fragment>
    </UIContext.Provider>
  );
};

// Create a custom hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useUI = (): UIContextType => {
  const context = React.useContext(UIContext); // Changed
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

// Force update
