import React from 'react';
import { useUI } from './context/UIContext';
import { DoctorProvider } from './context/DoctorContext';
import { OrderProvider } from './context/OrderContext';
import App from './App';
import LoadingOverlay from './components/LoadingOverlay'; // Import LoadingOverlay

const AppWrapper = () => {
  const { currentUser, authFetch, showToast, isLoading } = useUI(); // Get isLoading from useUI
  return (
    <DoctorProvider authFetch={authFetch} showToast={showToast}>
      <OrderProvider currentUser={currentUser} authFetch={authFetch}>
        <App />
      </OrderProvider>
      {isLoading && <LoadingOverlay />} {/* Conditionally render LoadingOverlay */}
    </DoctorProvider>
  );
};

export default AppWrapper;
