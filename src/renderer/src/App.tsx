import React, { useState, useEffect, useCallback } from 'react';
import AuthModal from './components/AuthModal.tsx';
import MainAppWrapper from './components/MainAppWrapper.tsx';

import { User, Notification } from '../types';
import { UIProvider } from './context/UIContext.tsx';
import { DoctorProvider } from './context/DoctorContext.tsx'; // Import DoctorProvider

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(true); // Default to open
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const closeAuthModal = useCallback(() => {
    if (currentUser) { // Only close auth modal if a user is logged in
      setAuthModalOpen(false);
    }
  }, [currentUser]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAppContentLoaded, setIsAppContentLoaded] = useState(false);

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordUsername, setForgotPasswordUsername] = useState('');
  const [forgotPasswordSecurityQuestion, setForgotPasswordSecurityQuestion] = useState('');
  const [authError, setAuthError] = useState('');



  const API_URL = import.meta.env.VITE_API_URL;

  // Función auxiliar para hacer fetch con token de autenticación
  const authFetch = useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      // Token inválido o expirado, o acceso denegado
      handleLogout(); // Cerrar sesión
      showToast('Sesión expirada o acceso denegado. Por favor, inicia sesión de nuevo.', 'error');
    }
    return response;
  }, [showToast]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/notifications`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fetchedNotifications = await response.json();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [API_URL, authFetch]);

  const loadData = useCallback(async () => {
    try {
      
      await fetchNotifications();
      setIsAppContentLoaded(true);
    } catch (error: unknown) {
      console.error("Error loading data:", error);
      showToast('Error al cargar datos. Revisa la consola.', 'error');
    }
  }, [fetchNotifications, showToast]); // Removed fetchDoctors from dependencies

  useEffect(() => {
    // Intentar cargar el usuario desde el token al iniciar la app
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ username: decodedUser.username, role: decodedUser.role });
        setIsAppContentLoaded(false); // Forzar recarga de datos si el token es válido
      } catch (e) {
        console.error("Error decodificando token:", e);
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null); // Asegurarse de que no haya usuario si no hay token
    }
  }, [setCurrentUser]);

  useEffect(() => {
    if (currentUser && !isAppContentLoaded) {
      loadData();
    }
  }, [currentUser, isAppContentLoaded, loadData]);

  const handleLogin = async (username: string, password: string) => {
    setAuthError('');
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (result.success) {
        setCurrentUser(result.user as User);
        localStorage.setItem('token', result.token); // Guardar el token
        showToast(`Bienvenido, ${result.user.username}!`);
        closeAuthModal(); // Cerrar el modal de autenticación
      } else {
        setAuthError(result.message || 'Error de autenticación');
        showToast(result.message || 'Error de autenticación', 'error');
      }
    } catch (error) {
      console.error("Error during login:", error);
      setAuthError('Error al iniciar sesión. Inténtalo de nuevo.');
      showToast('Error al iniciar sesión. Inténtalo de nuevo.', 'error');
    }
  };

  const onForgotPassword = async (username: string) => {
    setAuthError('');
    try {
      const response = await authFetch(`${API_URL}/users/security-question`, {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      const result = await response.json();
      if (result.success) {
        setForgotPasswordSecurityQuestion(result.securityQuestion);
        setForgotPasswordUsername(username);
        setForgotPasswordStep(2);
      } else {
        setAuthError(result.error || 'Usuario no encontrado');
        showToast(result.error || 'Usuario no encontrado', 'error');
      }
    } catch (error) {
      setAuthError('Error al buscar usuario. Inténtalo de nuevo.');
      showToast('Error al buscar usuario. Inténtalo de nuevo.', 'error');
    }
  };

  const handleForgotPasswordSubmitAnswer = async (answer: string) => {
    setAuthError('');
    try {
      const response = await authFetch(`${API_URL}/users/verify-answer`, {
        method: 'POST',
        body: JSON.stringify({ username: forgotPasswordUsername, answer }),
      });
      const result = await response.json();
      if (result.success) {
        setForgotPasswordStep(3);
      } else {
        setAuthError(result.message || 'Respuesta incorrecta.');
        showToast(result.message || 'Respuesta incorrecta.', 'error');
      }
    } catch (error) {
      setAuthError('Error al verificar respuesta. Inténtalo de nuevo.');
      showToast('Error al verificar respuesta. Inténtalo de nuevo.', 'error');
    }
  };

  const handleSetNewPassword = async (newPassword: string) => {
    setAuthError('');
    try {
      const response = await authFetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ username: forgotPasswordUsername, newPassword }),
      });
      const result = await response.json();
      if (result.success) {
        showToast('Contraseña restablecida con éxito. Por favor, inicia sesión.');
        setShowForgotPasswordModal(false);
        setForgotPasswordStep(1);
        setForgotPasswordUsername('');
        setForgotPasswordSecurityQuestion('');
      } else {
        setAuthError(result.message || 'Error al restablecer.');
        showToast(result.message || 'Error al restablecer.', 'error');
      }
    } catch (error) {
      setAuthError('Error al establecer nueva contraseña. Inténtalo de nuevo.');
      showToast('Error al establecer nueva contraseña. Inténtalo de nuevo.', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token'); // Eliminar el token
    setIsAppContentLoaded(false);
    showToast('Sesión cerrada.');
  };

  return (
    <>
      {!currentUser ? (
        <AuthModal
          onLogin={handleLogin}
          authError={authError}
          showNotification={showToast}
          showForgotPasswordModal={showForgotPasswordModal}
          setShowForgotPasswordModal={setShowForgotPasswordModal}
          forgotPasswordStep={forgotPasswordStep}
          setForgotPasswordStep={setForgotPasswordStep}
          forgotPasswordUsername={forgotPasswordUsername}
          setForgotPasswordUsername={setForgotPasswordUsername}
          forgotPasswordSecurityQuestion={forgotPasswordSecurityQuestion}
          onForgotPassword={onForgotPassword}
          handleForgotPasswordSubmitAnswer={handleForgotPasswordSubmitAnswer}
          handleSetNewPassword={handleSetNewPassword}
        />
      ) : (
        <DoctorProvider> {/* Wrap MainAppWrapper with DoctorProvider */}
          <MainAppWrapper
            currentUser={currentUser}
            notifications={notifications}
            setNotifications={setNotifications}
            handleLogout={handleLogout}
            authFetch={authFetch}
          />
        </DoctorProvider>
      )}
    </>
  );
}

export default App;
