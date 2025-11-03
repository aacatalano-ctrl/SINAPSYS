import React, { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal.tsx';
import MainAppWrapper from './components/MainAppWrapper.tsx';
import { useUI } from './context/UIContext';

import { User } from '../types';

function App() {
  const { currentUser, setCurrentUser, authFetch, showToast } = useUI();

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordUsername, setForgotPasswordUsername] = useState('');
  const [forgotPasswordSecurityQuestion, setForgotPasswordSecurityQuestion] = useState('');
  const [authError, setAuthError] = useState('');

  const API_URL = '/api';

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authFetch(`${API_URL}/auth/me`);
          if (response.ok) {
            const result = await response.json();
            setCurrentUser(result.user as User);
          } else {
            // Token is invalid or expired, clear it
            localStorage.removeItem('token');
            setCurrentUser(null);
          }
        } catch (e) {
          console.error("Error verificando token:", e);
          localStorage.removeItem('token');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    verifyToken();
  }, [setCurrentUser, authFetch]);

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
    } catch {
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
    } catch {
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
    } catch {
      setAuthError('Error al establecer nueva contraseña. Inténtalo de nuevo.');
      showToast('Error al establecer nueva contraseña. Inténtalo de nuevo.', 'error');
    }
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
        <MainAppWrapper
          currentUser={currentUser}
          authFetch={authFetch}
        />
      )}
    </>
  );
}

export default App;