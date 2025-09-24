import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import './index.css';
import App from './App.tsx';
import { OrderProvider } from './context/OrderContext.tsx';
import { DoctorProvider } from './context/DoctorContext.tsx';
import { UIProvider } from './context/UIContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <DoctorProvider>
      <OrderProvider>
        <App />
      </OrderProvider>
    </DoctorProvider>
  </StrictMode>,
);
