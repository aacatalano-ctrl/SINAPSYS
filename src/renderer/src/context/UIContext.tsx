
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

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
const UIContext = createContext<UIContextType | undefined>(undefined);

// Create a provider component
interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAddDoctorModalOpen, setAddDoctorModalOpen] = useState(false);
  const [isAddNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(true); // Default to open
  const [isConfirmCompletionModalOpen, setConfirmCompletionModalOpen] = useState(false);
  const [isEditOrderModalOpen, setEditOrderModalOpen] = useState(false);
  const [isEmailDraftModalOpen, setEmailDraftModalOpen] = useState(false);
  const [isDeleteReportModalOpen, setDeleteReportModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      hideToast();
    }, 3000);
  }, [hideToast]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    showToast('Sesión cerrada.');
  }, [setCurrentUser, showToast]);

  const authFetch = useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) { // Unauthorized (e.g., bad token)
      handleLogout();
      showToast('Sesión expirada. Por favor, inicia sesión de nuevo.', 'error');
    }
    return response;
  }, [showToast, handleLogout]);

  const fetchNotifications = useCallback(async () => {
    try {
      const fetchedNotifications = await authFetch(`/api/notifications`).then(res => res.json());
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [authFetch]);

  const handleMarkNotificationsAsRead = useCallback(async () => {
    try {
      await authFetch(`/api/notifications/mark-all-read`, { method: 'PUT' });
      fetchNotifications(); // Refresh notifications list
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }, [fetchNotifications, authFetch]);

  const handleClearAllNotifications = useCallback(async () => {
    try {
      await authFetch(`/api/notifications`, { method: 'DELETE' });
      fetchNotifications(); // Refresh to show empty list
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, [fetchNotifications, authFetch]);

  const handleDeleteNotification = useCallback(async (id: string) => {
    try {
      await authFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications(); // Refresh notifications list
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, [fetchNotifications, authFetch]);

  const openAddDoctorModal = useCallback(() => setAddDoctorModalOpen(true), []);
  const closeAddDoctorModal = useCallback(() => setAddDoctorModalOpen(false), []);

  const openAddNoteModal = useCallback(() => setAddNoteModalOpen(true), []);
  const closeAddNoteModal = useCallback(() => setAddNoteModalOpen(false), []);

  const openAddPaymentModal = useCallback(() => setAddPaymentModalOpen(true), []);
  const closeAddPaymentModal = useCallback(() => setAddPaymentModalOpen(false), []);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => {
    if (currentUser) { // Only close auth modal if a user is logged in
      setAuthModalOpen(false);
    }
  }, [currentUser]);

  const openConfirmCompletionModal = useCallback(() => setConfirmCompletionModalOpen(true), []);
  const closeConfirmCompletionModal = useCallback(() => setConfirmCompletionModalOpen(false), []);

  const openEditOrderModal = useCallback(() => setEditOrderModalOpen(true), []);
  const closeEditOrderModal = useCallback(() => setEditOrderModalOpen(false), []);

  const openEmailDraftModal = useCallback(() => setEmailDraftModalOpen(true), []);
  const closeEmailDraftModal = useCallback(() => setEmailDraftModalOpen(false), []);

  const openDeleteReportModal = useCallback(() => setDeleteReportModalOpen(true), []);
  const closeDeleteReportModal = useCallback(() => setDeleteReportModalOpen(false), []);

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
      {children}
    </UIContext.Provider>
  );
};

// Create a custom hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
