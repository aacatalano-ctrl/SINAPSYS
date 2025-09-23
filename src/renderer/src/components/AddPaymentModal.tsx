import React, { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Plus, Minus } from 'lucide-react';
import { Order } from '../../types';

interface AddPaymentModalProps {
    order: Order;
    onClose: () => void;
    isOpen: boolean;
    onAddPayment: (amount: number, description: string) => Promise<void>;
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
      showNotification('Pago registrado con éxito.', 'success');
      onClose();
    } catch (error) {
      console.error("Failed to save payment:", error);
      showNotification('Error al registrar el pago.', 'error');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Registrar Pago para Orden: {order._id}</h2>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-100 p-3">
          <p className="text-sm text-blue-800"><span className="font-semibold">Costo Total:</span> ${order.cost.toFixed(2)}</p>
          <p className="text-lg text-blue-900"><span className="font-semibold">Saldo Pendiente:</span> ${balance.toFixed(2)}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="paymentAmount" className="mb-2 block text-sm font-semibold text-gray-700">Monto del Pago:</label>
            <div className="flex w-40 items-center overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
              <span className="pl-3 text-gray-500">$</span>
              <input
                type="number"
                id="paymentAmount"
                className="grow px-1 py-2 leading-tight text-gray-700 focus:outline-none"
                value={amount}
                onChange={handleAmountChange}
                min="0"
                max={balance.toFixed(2)}
                step="1"
                required
                autoFocus
              />
              <div className="flex flex-col border-l border-gray-200">
                <button
                  type="button"
                  onClick={() => handleStepperClick(true)}
                  className="flex h-6 w-8 items-center justify-center rounded-tr-lg bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none"
                  title="Incrementar en $10"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepperClick(false)}
                  className="flex h-6 w-8 items-center justify-center rounded-br-lg border-t border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none"
                  title="Decrementar en $10"
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Ingresa el monto o usa los botones para ajustar.</p>
          </div>
          <div className="mb-6">
            <label htmlFor="paymentDescription" className="mb-2 block text-sm font-semibold text-gray-700">Descripción (opcional):</label>
            <input
              type="text"
              id="paymentDescription"
              className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-300 px-6 py-2 font-bold text-gray-800 transition-colors duration-200 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
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
