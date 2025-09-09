
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

// Define the shape of the toast state
interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Define the shape of the context
interface UIContextType {
  isAddDoctorModalOpen: boolean;
  isAddNoteModalOpen: boolean;
  isAddPaymentModalOpen: boolean;
  isAuthModalOpen: boolean;
  isConfirmCompletionModalOpen: boolean;
  isEditOrderModalOpen: boolean;
  isEmailDraftModalOpen: boolean;
  isDeleteReportModalOpen: boolean;
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
  const [isAddDoctorModalOpen, setAddDoctorModalOpen] = useState(false);
  const [isAddNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(true); // Default to open
  const [isConfirmCompletionModalOpen, setConfirmCompletionModalOpen] = useState(false);
  const [isEditOrderModalOpen, setEditOrderModalOpen] = useState(false);
  const [isEmailDraftModalOpen, setEmailDraftModalOpen] = useState(false);
  const [isDeleteReportModalOpen, setDeleteReportModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const openAddDoctorModal = useCallback(() => setAddDoctorModalOpen(true), []);
  const closeAddDoctorModal = useCallback(() => setAddDoctorModalOpen(false), []);

  const openAddNoteModal = useCallback(() => setAddNoteModalOpen(true), []);
  const closeAddNoteModal = useCallback(() => setAddNoteModalOpen(false), []);

  const openAddPaymentModal = useCallback(() => setAddPaymentModalOpen(true), []);
  const closeAddPaymentModal = useCallback(() => setAddPaymentModalOpen(false), []);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const openConfirmCompletionModal = useCallback(() => setConfirmCompletionModalOpen(true), []);
  const closeConfirmCompletionModal = useCallback(() => setConfirmCompletionModalOpen(false), []);

  const openEditOrderModal = useCallback(() => setEditOrderModalOpen(true), []);
  const closeEditOrderModal = useCallback(() => setEditOrderModalOpen(false), []);

  const openEmailDraftModal = useCallback(() => setEmailDraftModalOpen(true), []);
  const closeEmailDraftModal = useCallback(() => setEmailDraftModalOpen(false), []);

  const openDeleteReportModal = useCallback(() => setDeleteReportModalOpen(true), []);
  const closeDeleteReportModal = useCallback(() => setDeleteReportModalOpen(false), []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      hideToast();
    }, 3000);
  }, [hideToast]);

  const value = {
    isAddDoctorModalOpen,
    isAddNoteModalOpen,
    isAddPaymentModalOpen,
    isAuthModalOpen,
    isConfirmCompletionModalOpen,
    isEditOrderModalOpen,
    isEmailDraftModalOpen,
    isDeleteReportModalOpen,
    toast,
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
