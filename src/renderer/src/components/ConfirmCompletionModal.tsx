import React, { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order } from '../../types';
import { Plus, Minus } from 'lucide-react';

interface ConfirmCompletionModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

const ConfirmCompletionModal: React.FC<ConfirmCompletionModalProps> = ({
  isOpen,
  order,
  onClose,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const { calculateBalance, addPaymentToOrder, handleUpdateOrderStatus, showNotification } =
    useOrders();

  const balance = useMemo(() => {
    if (!order) return 0;
    return calculateBalance(order);
  }, [order, calculateBalance]);

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount('');
    }
  }, [isOpen]);

  if (!isOpen || !order) {
    return null;
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setPaymentAmount('');
      return;
    }
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= balance) {
      setPaymentAmount(value);
    } else if (numericValue > balance) {
      setPaymentAmount(balance.toFixed(2));
      showNotification(`El pago no puede exceder el saldo de ${balance.toFixed(2)}.`, 'warning');
    }
  };

  const handleStepperClick = (increment: boolean) => {
    let currentVal = parseFloat(paymentAmount);
    if (isNaN(currentVal)) currentVal = 0;
    let newValue = currentVal + (increment ? 10 : -10);

    if (newValue > balance) {
      newValue = balance;
    } else if (newValue < 0) {
      newValue = 0;
    }

    setPaymentAmount(String(newValue.toFixed(2)));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedAmount = parseFloat(paymentAmount) || 0; // Ensure it's 0 if empty or NaN

    try {
      // Only add payment if amount is positive
      if (parsedAmount > 0) {
        if (parsedAmount > balance) {
          showNotification(
            `El monto no puede ser mayor al saldo pendiente de ${balance.toFixed(2)}.`,
            'error',
          );
          return;
        }
        await addPaymentToOrder(order._id, parsedAmount, 'Pago al completar');
      }

      // Always update status to 'Completado'
      await handleUpdateOrderStatus(order._id, 'Completado', new Date().toISOString());
      showNotification(`Orden ${order.orderNumber} marcada como completada.`, 'success');
      onClose();
    } catch (error) {
      console.error('Error during order completion:', error);
      showNotification('Error al confirmar la finalización.', 'error'); // Add notification for error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          Finalizar Orden: {order.orderNumber}
        </h2>
        <p className="mb-4 text-gray-700">
          Vas a marcar esta orden como <span className="font-bold text-green-600">Completada</span>.
        </p>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-100 p-3">
          <p className="text-lg text-blue-900">
            <span className="font-semibold">Saldo Pendiente:</span> ${balance.toFixed(2)}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="finalPayment"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Abono Adicional (Opcional):
            </label>
            <div className="flex w-40 items-center overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
              <span className="pl-3 text-gray-500">$</span>
              <input
                type="number"
                id="finalPayment"
                className="grow px-1 py-2 leading-tight text-gray-700 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={paymentAmount}
                onChange={handleAmountChange}
                min="0"
                max={balance.toFixed(2)}
                step="0.01"
                placeholder="0.00"
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
            <p className="mt-1 text-xs text-gray-500">
              Deja en blanco o en 0 si no hay pago adicional.
            </p>
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
              className="rounded-lg bg-green-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-green-700"
            >
              Confirmar y Completar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmCompletionModal;
