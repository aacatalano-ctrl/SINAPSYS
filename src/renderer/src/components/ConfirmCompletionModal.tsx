import React, { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order } from '../../types';
import { Plus, Minus } from 'lucide-react';

interface ConfirmCompletionModalProps {
    isOpen: boolean;
    order: Order | null;
    onClose: () => void;
}

const ConfirmCompletionModal: React.FC<ConfirmCompletionModalProps> = ({ isOpen, order, onClose }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const { calculateBalance, addPaymentToOrder, handleUpdateOrderStatus, showNotification } = useOrders();

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
    const parsedAmount = parseFloat(paymentAmount);

    try {
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        if (parsedAmount > balance) {
          showNotification(`El monto no puede ser mayor al saldo pendiente de ${balance.toFixed(2)}.`, 'error');
          return;
        }
        await addPaymentToOrder(order.id, parsedAmount, 'Pago al completar');
      }

      await handleUpdateOrderStatus(order.id, 'Completado', new Date().toISOString());
      showNotification(`Orden ${order.id} marcada como completada.`, 'success');
      onClose();
    } catch (error) {
      console.error("Error during order completion:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Finalizar Orden: {order.id}</h2>
        <p className="mb-4 text-gray-700">
          Vas a marcar esta orden como <span className="font-bold text-green-600">Completada</span>.
        </p>
        
        <div className="mb-6 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <p className="text-lg text-blue-900"><span className="font-semibold">Saldo Pendiente:</span> ${balance.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="finalPayment" className="block text-gray-700 text-sm font-semibold mb-2">Abono Adicional (Opcional):</label>
            <div className="flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden w-40">
              <span className="pl-3 text-gray-500">$</span>
              <input
                type="number"
                id="finalPayment"
                className="flex-grow py-2 px-1 text-gray-700 leading-tight focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            <p className="text-xs text-gray-500 mt-1">Deja en blanco o en 0 si no hay pago adicional.</p>
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
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
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
