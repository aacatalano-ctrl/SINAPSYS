import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { OrderProvider } from './context/OrderContext.tsx';
import { DoctorProvider } from './context/DoctorContext.tsx';
import { UIProvider, useUI } from './context/UIContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// This wrapper component is necessary to access the currentUser from UIContext
// and pass it to OrderProvider, as OrderProvider is a sibling in the tree.
const AppWrapper = () => {
  const { currentUser } = useUI();
  return (
    <DoctorProvider>
      <OrderProvider currentUser={currentUser}>
        <App />
      </OrderProvider>
    </DoctorProvider>
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <UIProvider>
        <AppWrapper />
      </UIProvider>
    </BrowserRouter>
  </StrictMode>,
);