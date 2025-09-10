import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUI } from './UIContext';
import { Order, Payment, Note, User } from '../../types';

interface OrderContextType {
  orders: Order[];
  fetchOrders: () => Promise<void>;
  isDataLoaded: boolean;
  showNotification: (message: string, type?: string) => void;
  currentUser: User | null;
  handleOrderCreated: (newOrder: Omit<Order, 'id' | '_id' | 'status' | 'creationDate' | 'payments' | 'notes'>) => Promise<Order | undefined>;
  calculateBalance: (order: Order) => number;
  addPaymentToOrder: (orderId: string, amount: number, description: string) => Promise<void>;
  handleSaveNote: (orderId: string, noteText: string) => Promise<void>;
  handleUpdateOrderStatus: (orderId: string, newStatus: 'Pendiente' | 'Procesando' | 'Completado', completionDate?: string | null) => Promise<void>;
  handleDeleteOrder: (id: string) => Promise<void>;
  handleUpdateOrder: (id: string, updatedFields: Partial<Order>) => Promise<void>;
  generateReceiptPDF: (order: Order, currentUser: User) => Promise<void>;
  confirmCompletion: (order: Order, paymentAmount: number) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

interface OrderProviderProps {
  children: React.ReactNode;
  currentUser: User | null;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { showToast } = useUI();

  const API_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:3001/api';

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const loadedOrders = await response.json();
      setOrders(loadedOrders.filter(Boolean));
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Error loading orders from web server:", error);
      showToast('Error al cargar órdenes.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const calculateBalance = (order: Order): number => {
    if (!order || !order.payments) return order?.cost || 0;
    const totalDeposited = order.payments.reduce((sum, p) => sum + p.amount, 0);
    return order.cost - totalDeposited;
  };

  const handleUpdateOrder = useCallback(async (id: string, updatedFields: Partial<Order>) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await fetchOrders();
      showToast('Orden actualizada con éxito.');
    } catch (error) {
      console.error("Error updating order:", error);
      showToast('Error al actualizar la orden.', 'error');
      throw error;
    }
  }, [fetchOrders, showToast]);

  const handleOrderCreated = async (orderData: Omit<Order, 'id' | '_id' | 'status' | 'creationDate' | 'payments' | 'notes'>): Promise<Order | undefined> => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const addedOrder = await response.json();
      await fetchOrders();
      showToast('Orden creada con éxito.');
      return addedOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      showToast(`Error al crear la orden: ${error}`, 'error');
      throw error;
    }
  };

  const addPaymentToOrder = async (orderId: string, amount: number, description: string): Promise<void> => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      amount: parseFloat(String(amount)),
      date: new Date().toISOString(),
      description: description || 'Pago',
    };
    const updatedPayments = [...order.payments, newPayment];
    await handleUpdateOrder(orderId, { payments: updatedPayments });
  };

  const handleSaveNote = async (orderId: string, noteText: string): Promise<void> => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: noteText,
      timestamp: new Date().toISOString(),
      author: currentUser?.username || 'Usuario',
    };
    const updatedNotes = [...order.notes, newNote];
    await handleUpdateOrder(orderId, { notes: updatedNotes });
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status'], completionDate: string | null = null): Promise<void> => {
    const updateFields: Partial<Order> = { status: newStatus };
    if (newStatus === 'Completado') {
      updateFields.completionDate = completionDate || new Date().toISOString();
    }
    await handleUpdateOrder(orderId, updateFields);
  };

  const handleDeleteOrder = async (id: string): Promise<void> => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden? Esta acción es irreversible.')) {
      try {
        const response = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        await fetchOrders();
        showToast('Orden eliminada con éxito.');
      } catch (error) {
        console.error("Error deleting order:", error);
        showToast('Error al eliminar la orden.', 'error');
      }
    }
  };

  const generateReceiptPDF = async (order: Order, currentUser: User): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/orders/${order.id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, currentUser }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.id}-Recibo.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Recibo descargado.');
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast('Error al generar el recibo PDF.', 'error');
    }
  };

  const confirmCompletion = async (order: Order, paymentAmount: number): Promise<void> => {
    if (!order) return;
    try {
      if (paymentAmount > 0) {
        await addPaymentToOrder(order.id, paymentAmount, 'Pago al completar');
      }
      await handleUpdateOrderStatus(order.id, 'Completado');
      const balance = calculateBalance(order) - paymentAmount;
      if (balance > 0) {
        showToast(`Orden completada con saldo pendiente de ${balance.toFixed(2)}.`, 'info');
      } else {
        showToast('Orden completada y pagada.', 'success');
      }
    } catch (error) {
      console.error("Error confirming completion:", error);
      showToast('Error al confirmar la finalización.', 'error');
    }
  };

  return (
    <OrderContext.Provider value={{
      orders,
      fetchOrders,
      isDataLoaded,
      showNotification: showToast,
      currentUser,
      handleOrderCreated,
      calculateBalance,
      addPaymentToOrder,
      handleSaveNote,
      handleUpdateOrderStatus,
      handleDeleteOrder,
      handleUpdateOrder,
      generateReceiptPDF,
      confirmCompletion,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === null) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
