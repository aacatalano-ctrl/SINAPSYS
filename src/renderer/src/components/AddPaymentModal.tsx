import React, { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Plus, Minus } from 'lucide-react';
import { Order } from '../../types';

interface AddPaymentModalProps {
    order: Order;
    onClose: () => void;
    isOpen: boolean;
    onAddPayment: (amount: number, description: string) => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ order, onClose, isOpen, onAddPayment }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { calculateBalance, showNotification } = useOrders();

  const balance = useMemo(() => calculateBalance(order), [order, calculateBalance]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
    }
  }, [isOpen]);

  // Let the user type freely. The browser will handle locale-specific input (e.g., commas).
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  // Normalize the value for calculation, and set it back to a period-based string.
  const handleStepperClick = (increment: boolean) => {
    const currentVal = parseFloat(String(amount).replace(',', '.')) || 0;
    let newValue = currentVal + (increment ? 10 : -10);
    
    if (newValue > balance) {
      newValue = balance;
    } else if (newValue < 0) {
      newValue = 0;
    }

    // Always use a period for the internal state to prevent parsing errors.
    setAmount(newValue.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Normalize the value at the last possible moment, before validation and submission.
    const normalizedAmount = String(amount).replace(',', '.');
    const parsedAmount = parseFloat(normalizedAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('Por favor, ingresa un monto válido y mayor a cero.', 'error');
      return;
    }
    if (parsedAmount > balance) {
      showNotification(`El monto no puede ser mayor al saldo pendiente de ${balance.toFixed(2)}.`, 'error');
      return;
    }
    try {
      await onAddPayment(parsedAmount, description);
      onClose();
    } catch (error) {
      console.error("Failed to save payment:", error);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Pago para Orden: {order.id}</h2>
        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800"><span className="font-semibold">Costo Total:</span> ${order.cost.toFixed(2)}</p>
          <p className="text-lg text-blue-900"><span className="font-semibold">Saldo Pendiente:</span> ${balance.toFixed(2)}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="paymentAmount" className="block text-gray-700 text-sm font-semibold mb-2">Monto del Pago:</label>
            <div className="flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden w-40">
              <span className="pl-3 text-gray-500">$</span>
              <input
                type="number"
                id="paymentAmount"
                className="flex-grow py-2 px-1 text-gray-700 leading-tight focus:outline-none"
                value={amount}
                onChange={handleAmountChange}
                min="0"
                max={balance.toFixed(2)}
                step="10"
                required
                autoFocus
              />
              <div className="flex flex-col border-l border-gray-200">
                <button
                  type="button"
                  onClick={() => handleStepperClick(true)}
                  className="w-8 h-6 flex items-center justify-center text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none rounded-tr-lg"
                  title="Incrementar en $10"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepperClick(false)}
                  className="w-8 h-6 flex items-center justify-center text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none rounded-br-lg border-t border-gray-200"
                  title="Decrementar en $10"
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Ingresa el monto o usa los botones para ajustar.</p>
          </div>
          <div className="mb-6">
            <label htmlFor="paymentDescription" className="block text-gray-700 text-sm font-semibold mb-2">Descripción (opcional):</label>
            <input
              type="text"
              id="paymentDescription"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
            >
              Guardar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;
