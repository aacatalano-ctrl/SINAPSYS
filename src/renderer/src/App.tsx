import React, { useState, useEffect, useCallback } from 'react';
import AuthModal from './components/AuthModal.tsx';
import MainAppWrapper from './components/MainAppWrapper.tsx';
import { useUI } from './context/UIContext.tsx';
import { useDoctors } from './context/DoctorContext.tsx';
import { User, Notification } from '../types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAppContentLoaded, setIsAppContentLoaded] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordUsername, setForgotPasswordUsername] = useState('');
  const [forgotPasswordSecurityQuestion, setForgotPasswordSecurityQuestion] = useState('');
  const [authError, setAuthError] = useState('');

  const { showToast } = useUI();
  const { fetchDoctors } = useDoctors();

  const API_URL = 'http://localhost:3001/api';

  const fetchNotifications = useCallback(async () => {
    // In a real web app, this would be a fetch call or a WebSocket connection.
    setNotifications([]);
  }, []);

  const loadData = useCallback(async () => {
    try {
      await fetchDoctors();
      await fetchNotifications();
      setIsAppContentLoaded(true);
    } catch (error: unknown) {
      console.error("Error loading data:", error);
      showToast('Error al cargar datos. Revisa la consola.', 'error');
    }
  }, [fetchDoctors, fetchNotifications, showToast]);

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
        showToast(`Bienvenido, ${result.user.username}!`);
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

  const handleRegister = async (username: string, password: string, securityQuestion: string, securityAnswer: string) => {
    setAuthError('');
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, securityQuestion, securityAnswer }),
      });
      const registeredUser = await response.json();
      if (!response.ok) {
        throw new Error(registeredUser.error || 'Error al registrar usuario.');
      }
      showToast(`Cuenta creada con éxito para ${registeredUser.username}. Por favor, inicia sesión.`);
      setIsRegistering(false);
    } catch (error: unknown) {
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const onForgotPassword = async (username: string) => {
    setAuthError('');
    try {
      const response = await fetch(`${API_URL}/users/security-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${API_URL}/users/verify-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    setIsAppContentLoaded(false);
    showToast('Sesión cerrada.');
  };

  if (!currentUser) {
    return (
      <AuthModal
        onLogin={handleLogin}
        onRegister={handleRegister}
        authError={authError}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
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
    );
  }

  return (
    <MainAppWrapper
      currentUser={currentUser}
      notifications={notifications}
      setNotifications={setNotifications}
      handleLogout={handleLogout}
    />
  );
}

export default App;
