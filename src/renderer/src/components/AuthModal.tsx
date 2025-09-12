import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const AuthModal = ({ onLogin, onForgotPassword, authError, showForgotPasswordModal, setShowForgotPasswordModal, forgotPasswordStep, setForgotPasswordStep, forgotPasswordUsername, setForgotPasswordUsername, forgotPasswordSecurityQuestion, handleForgotPasswordSubmitAnswer, handleSetNewPassword, showNotification }: { onLogin: (username: string, password: string) => Promise<void>; onForgotPassword: (username: string) => Promise<void>; authError: string; showForgotPasswordModal: boolean; setShowForgotPasswordModal: React.Dispatch<React.SetStateAction<boolean>>; forgotPasswordStep: number; setForgotPasswordStep: React.Dispatch<React.SetStateAction<number>>; forgotPasswordUsername: string; setForgotPasswordUsername: React.Dispatch<React.SetStateAction<string>>; forgotPasswordSecurityQuestion: string; handleForgotPasswordSubmitAnswer: (answer: string) => Promise<void>; handleSetNewPassword: (newPassword: string) => Promise<void>; showNotification: (message: string, type?: string) => void; }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [forgotPasswordAnswer, setForgotPasswordAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [forgotPasswordAnswer, setForgotPasswordAnswer] = useState('');

  const handleAuthSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const handleForgotPasswordFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (forgotPasswordStep === 1) {
      onForgotPassword(forgotPasswordUsername);
    } else if (forgotPasswordStep === 2) {
      handleForgotPasswordSubmitAnswer(forgotPasswordAnswer);
    } else if (forgotPasswordStep === 3) {
      if (newPassword !== newConfirmPassword) {
        showNotification('Las nuevas contraseñas no coinciden.', 'error');
        return;
      }
      handleSetNewPassword(newPassword);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Iniciar Sesión
        </h2>

        {showForgotPasswordModal ? (
          <form onSubmit={handleForgotPasswordFormSubmit}>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Recuperar Contraseña</h3>
            {forgotPasswordStep === 1 && (
              <div className="mb-4">
                <label htmlFor="fpUsername" className="block text-gray-700 text-sm font-bold mb-2">Nombre de Usuario:</label>
                <input
                  type="text"
                  id="fpUsername"
                  className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={forgotPasswordUsername}
                  onChange={(e) => setForgotPasswordUsername(e.target.value)}
                  required
                />
              </div>
            )}
            {forgotPasswordStep === 2 && (
              <div className="mb-4">
                <label htmlFor="fpSecurityQuestion" className="block text-gray-700 text-sm font-bold mb-2">Pregunta Secreta:</label>
                <p className="mb-2 p-3 bg-gray-100 rounded-lg text-gray-800">{forgotPasswordSecurityQuestion}</p>
                <label htmlFor="fpSecurityAnswer" className="block text-gray-700 text-sm font-bold mb-2">Tu Respuesta:</label>
                <input
                  type="text"
                  id="fpSecurityAnswer"
                  className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={forgotPasswordAnswer}
                  onChange={(e) => setForgotPasswordAnswer(e.target.value)}
                  required
                />
              </div>
            )}
            {forgotPasswordStep === 3 && (
              <>
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">Nueva Contraseña:</label>
                  <input
                    type="password"
                    id="newPassword"
                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="newConfirmPassword" className="block text-gray-700 text-sm font-bold mb-2">Confirmar Nueva Contraseña:</label>
                  <input
                    type="password"
                    id="newConfirmPassword"
                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {authError && <p className="text-red-500 text-sm mb-4 text-center">{authError}</p>}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordStep(1);
                  showNotification('', 'error');
                }}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-semibold transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver al Login
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
              >
                {forgotPasswordStep === 1 ? 'Buscar Usuario' : forgotPasswordStep === 2 ? 'Verificar Respuesta' : 'Establecer Contraseña'}
              </button>
            </div>
          </form>

        ) : (
          <form onSubmit={handleAuthSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Nombre de Usuario:</label>
              <input
                type="text"
                id="username"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Contraseña:</label>
              <input
                type="password"
                id="password"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {authError && <p className="text-red-500 text-sm mb-4 text-center">{authError}</p>}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
              >
                Iniciar Sesión
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(true);
                  showNotification('', 'error');
                  setForgotPasswordStep(1);
                  setForgotPasswordUsername('');
                }}
                className="inline-block align-baseline font-bold text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;