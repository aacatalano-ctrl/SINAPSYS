import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const AuthModal = ({ onLogin, onForgotPassword, authError, showForgotPasswordModal, setShowForgotPasswordModal, forgotPasswordStep, setForgotPasswordStep, forgotPasswordUsername, setForgotPasswordUsername, forgotPasswordSecurityQuestion, handleForgotPasswordSubmitAnswer, handleSetNewPassword, showNotification }: { onLogin: (username: string, password: string) => Promise<void>; onForgotPassword: (username: string) => Promise<void>; authError: string; showForgotPasswordModal: boolean; setShowForgotPasswordModal: React.Dispatch<React.SetStateAction<boolean>>; forgotPasswordStep: number; setForgotPasswordStep: React.Dispatch<React.SetStateAction<number>>; forgotPasswordUsername: string; setForgotPasswordUsername: React.Dispatch<React.SetStateAction<string>>; forgotPasswordSecurityQuestion: string; handleForgotPasswordSubmitAnswer: (answer: string) => Promise<void>; handleSetNewPassword: (newPassword: string) => Promise<void>; showNotification: (message: string, type?: string) => void; }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [forgotPasswordAnswer, setForgotPasswordAnswer] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/75">
      <div className="w-full max-w-sm scale-100 rounded-lg bg-white p-8 opacity-100 shadow-2xl transition-all duration-300">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Iniciar Sesión
        </h2>

        {showForgotPasswordModal ? (
          <form onSubmit={handleForgotPasswordFormSubmit}>
            <h3 className="mb-4 text-xl font-semibold text-gray-700">Recuperar Contraseña</h3>
            {forgotPasswordStep === 1 && (
              <div className="mb-4">
                <label htmlFor="fpUsername" className="mb-2 block text-sm font-bold text-gray-700">Nombre de Usuario:</label>
                <input
                  type="text"
                  id="fpUsername"
                  className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={forgotPasswordUsername}
                  onChange={(e) => setForgotPasswordUsername(e.target.value)}
                  required
                />
              </div>
            )}
            {forgotPasswordStep === 2 && (
              <div className="mb-4">
                <label htmlFor="fpSecurityQuestion" className="mb-2 block text-sm font-bold text-gray-700">Pregunta Secreta:</label>
                <p className="mb-2 rounded-lg bg-gray-100 p-3 text-gray-800">{forgotPasswordSecurityQuestion}</p>
                <label htmlFor="fpSecurityAnswer" className="mb-2 block text-sm font-bold text-gray-700">Tu Respuesta:</label>
                <input
                  type="text"
                  id="fpSecurityAnswer"
                  className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={forgotPasswordAnswer}
                  onChange={(e) => setForgotPasswordAnswer(e.target.value)}
                  required
                />
              </div>
            )}
            {forgotPasswordStep === 3 && (
              <>
                <div className="relative mb-4"> {/* Added relative for icon positioning */}
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-bold text-gray-700">Nueva Contraseña:</label>
                  <input
                    type={showNewPassword ? 'text' : 'password'} // Dynamic type
                    id="newPassword"
                    className="w-full appearance-none rounded-lg border px-4 py-3 pr-10 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" // Added pr-10
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <span
                    className="absolute inset-y-0 right-0 top-7 flex cursor-pointer items-center pr-3" // Adjusted top
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-5 text-gray-400" />
                    ) : (
                      <Eye className="size-5 text-gray-400" />
                    )}
                  </span>
                </div>
                <div className="relative mb-6"> {/* Added relative for icon positioning */}
                  <label htmlFor="newConfirmPassword" className="mb-2 block text-sm font-bold text-gray-700">Confirmar Nueva Contraseña:</label>
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'} // Dynamic type
                    id="newConfirmPassword"
                    className="w-full appearance-none rounded-lg border px-4 py-3 pr-10 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" // Added pr-10
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    required
                  />
                  <span
                    className="absolute inset-y-0 right-0 top-7 flex cursor-pointer items-center pr-3" // Adjusted top
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  >
                    {showConfirmNewPassword ? (
                      <EyeOff className="size-5 text-gray-400" />
                    ) : (
                      <Eye className="size-5 text-gray-400" />
                    )}
                  </span>
                </div>
              </>
            )}

            {authError && <p className="mb-4 text-center text-sm text-red-500">{authError}</p>}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordStep(1);
                  showNotification('', 'error');
                }}
                className="inline-flex items-center text-sm font-semibold text-gray-600 transition-colors duration-200 hover:text-gray-800"
              >
                <ArrowLeft className="mr-1 size-4" /> Volver al Login
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/75"
              >
                {forgotPasswordStep === 1 ? 'Buscar Usuario' : forgotPasswordStep === 2 ? 'Verificar Respuesta' : 'Establecer Contraseña'}
              </button>
            </div>
          </form>

        ) : (
          <>
            <form onSubmit={handleAuthSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="mb-2 block text-sm font-bold text-gray-700">Nombre de Usuario:</label>
                <input
                  type="text"
                  id="username"
                  className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="relative mb-6"> {/* Added relative for icon positioning */}
                <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-700">Contraseña:</label>
                <input
                  type={showLoginPassword ? 'text' : 'password'} // Dynamic type
                  id="password"
                  className="w-full appearance-none rounded-lg border px-4 py-3 pr-10 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" // Added pr-10
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="absolute inset-y-0 right-0 top-7 flex cursor-pointer items-center pr-3" // Adjusted top
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? (
                    <EyeOff className="size-5 text-gray-400" />
                  ) : (
                    <Eye className="size-5 text-gray-400" />
                  )}
                </span>
              </div>

              {authError && <p className="mb-4 text-center text-sm text-red-500">{authError}</p>}

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/75"
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
                  className="inline-block align-baseline text-sm font-bold text-gray-600 transition-colors duration-200 hover:text-gray-800"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
