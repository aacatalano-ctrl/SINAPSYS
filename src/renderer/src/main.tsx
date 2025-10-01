import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppWrapper from './AppWrapper.tsx';
import { UIProvider } from './context/UIContext.tsx';

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <UIProvider>
        <AppWrapper />
      </UIProvider>
    </BrowserRouter>
  </StrictMode>,
);