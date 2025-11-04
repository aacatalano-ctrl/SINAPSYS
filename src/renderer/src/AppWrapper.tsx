import React from 'react';
import { useUI } from './context/UIContext';
import { DoctorProvider } from './context/DoctorContext';
import { OrderProvider } from './context/OrderContext';
import App from './App';

const AppWrapper = () => {
  const { currentUser, authFetch, showToast } = useUI();
  return (
    <DoctorProvider authFetch={authFetch} showToast={showToast}>
      <OrderProvider currentUser={currentUser} authFetch={authFetch}>
        <App />
      </OrderProvider>
    </DoctorProvider>
  );
};

export default AppWrapper;
