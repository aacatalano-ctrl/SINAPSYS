import React from 'react';
import { useUI } from './context/UIContext';
import { DoctorProvider } from './context/DoctorContext';
import { OrderProvider } from './context/OrderContext';
import App from './App';

const AppWrapper = () => {
  const { currentUser, authFetch } = useUI();
  return (
    <DoctorProvider authFetch={authFetch}>
      <OrderProvider currentUser={currentUser} authFetch={authFetch}>
        <App />
      </OrderProvider>
    </DoctorProvider>
  );
};

export default AppWrapper;
