import React, { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order, Payment } from '../../types';
import { Plus, Minus } from 'lucide-react';

interface AddPaymentModalProps {
  order: Order;
  onClose: () => void;
  isOpen: boolean;
  onAddPayment: (amount: number, description: string) => Promise<void>;
  onUpdatePayment: (
    orderId: string,
    paymentId: string,
    paymentData: Partial<Payment>,
  ) => Promise<void>;
  paymentToEdit?: Payment | null;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  order,
  onClose,
  isOpen,
  onAddPayment,
  onUpdatePayment,
  paymentToEdit,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const { calculateBalance, showNotification } = useOrders();

  const isEditMode = useMemo(() => !!paymentToEdit, [paymentToEdit]);
  const balance = useMemo(() => {
    if (!order) return 0; // Guard against null order
    const currentBalance = calculateBalance(order);
    return isEditMode ? currentBalance + (paymentToEdit?.amount || 0) : currentBalance;
  }, [order, calculateBalance, isEditMode, paymentToEdit]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && paymentToEdit) {
        setAmount(paymentToEdit.amount.toString());
        setDescription(paymentToEdit.description || '');
      } else {
        setAmount('');
        setDescription('');
      }
    }
  }, [isOpen, isEditMode, paymentToEdit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setAmount('');
      return;
    }
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= balance) {
      setAmount(value);
    } else if (numericValue > balance) {
      setAmount(balance.toFixed(2));
      showNotification(`El pago no puede exceder el saldo de ${balance.toFixed(2)}.`, 'warning');
    }
  };

  const handleStepperClick = (increment: boolean) => {
    let currentVal = parseFloat(amount);
    if (isNaN(currentVal)) currentVal = 0;
    let newValue = currentVal + (increment ? 10 : -10);

    if (newValue > balance) {
      newValue = balance;
    } else if (newValue < 0) {
      newValue = 0;
    }

    setAmount(String(newValue.toFixed(2)));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedAmount = String(amount).replace(',', '.');
    const parsedAmount = parseFloat(normalizedAmount);

    if (isEditMode) {
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('Por favor, ingresa un monto válido y mayor a cero.', 'error');
      return;
    }
    if (parsedAmount > balance) {
      showNotification(
        `El monto no puede ser mayor al saldo disponible de ${balance.toFixed(2)}.`,
        'error',
      );
      return;
    }

    try {
      if (isEditMode && paymentToEdit?._id) {
        await onUpdatePayment(order._id, paymentToEdit._id, {
          amount: parsedAmount,
          description,
          date: paymentToEdit.date,
        });
        onClose(); // Close only on success
      } else {
        await onAddPayment(parsedAmount, description);
        onClose(); // Close only on success
      }
    } catch (error) {
      console.error('AddPaymentModal: Failed to save payment:', error);
      showNotification('Error al guardar el pago. Inténtalo de nuevo.', 'error'); // Add user feedback
    }
  };

  if (!isOpen || !order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          {isEditMode ? 'Editar Abono' : `Registrar Pago para Orden: ${order.orderNumber}`}
        </h2>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-100 p-3">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Costo Total:</span> ${order.cost.toFixed(2)}
          </p>
          <p className="text-lg text-blue-900">
            <span className="font-semibold">Saldo Disponible:</span> ${balance.toFixed(2)}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="paymentAmount"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Monto del Abono:
            </label>
            <div className="flex w-40 items-center overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
              <span className="pl-3 text-gray-500">$</span>
              <input
                type="number"
                id="paymentAmount"
                className="grow px-1 py-2 leading-tight text-gray-700 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={amount}
                onChange={handleAmountChange}
                min="0"
                max={balance.toFixed(2)}
                step="0.01"
                placeholder="0.00"
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
          </div>
          <div className="mb-6">
            <label
              htmlFor="paymentDescription"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Descripción (opcional):
            </label>
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
              {isEditMode ? 'Actualizar Abono' : 'Guardar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;
