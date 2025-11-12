/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUI } from './UIContext';
import { useDoctors } from './DoctorContext';
import { Order, Payment, Note, User } from '../../types';
interface OrderContextType {
  orders: Order[];
  fetchOrders: () => Promise<void>;
  isDataLoaded: boolean;
  showNotification: (message: string, type?: string) => void;
  currentUser: User | null;
  handleOrderCreated: (
    newOrder: Omit<Order, 'id' | '_id' | 'status' | 'creationDate' | 'payments' | 'notes'>,
  ) => Promise<Order | undefined>;
  calculateBalance: (order: Order) => number;
  addPaymentToOrder: (orderId: string, amount: number, description: string) => Promise<void>;
  updatePaymentInOrder: (
    orderId: string,
    paymentId: string,
    paymentData: Partial<Payment>,
  ) => Promise<void>;
  deletePaymentFromOrder: (orderId: string, paymentId: string) => Promise<void>;
  handleSaveNote: (orderId: string, noteText: string) => Promise<void>;
  handleUpdateNote: (orderId: string, noteId: string, newText: string) => Promise<void>;
  handleDeleteNote: (orderId: string, noteId: string) => Promise<void>;
  handleUpdateOrderStatus: (
    orderId: string,
    newStatus: 'Pendiente' | 'Procesando' | 'Completado',
    completionDate?: string | null,
  ) => Promise<void>;
  handleDeleteOrder: (id: string) => Promise<string | void>;
  handleUpdateOrder: (id: string, updatedFields: Partial<Order>) => Promise<void>;
  generateReceiptPDF: (order: Order) => Promise<void>;
  generatePaymentHistoryPDF: (order: Order) => Promise<void>;
  confirmCompletion: (order: Order, paymentAmount: number) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

interface OrderProviderProps {
  children: React.ReactNode;
  currentUser: User | null;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({
  children,
  currentUser,
  authFetch,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { showToast, fetchNotifications } = useUI();
  const { isDoctorsLoaded, doctors } = useDoctors();

  const API_URL = '/api';

  const fetchOrders = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/orders`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const loadedOrders = await response.json();
      setOrders(loadedOrders.filter(Boolean));
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading orders from web server:', error);
      showToast('Error al cargar órdenes.', 'error');
    }
  }, [showToast, authFetch]);

  useEffect(() => {
    if (isDoctorsLoaded) {
      fetchOrders();
    }
  }, [isDoctorsLoaded, fetchOrders, doctors]);

  const calculateBalance = (order: Order): number => {
    if (!order || !order.payments) return order?.cost || 0;
    const totalDeposited = order.payments.reduce((sum, p) => sum + p.amount, 0);
    return order.cost - totalDeposited;
  };

  const handleUpdateOrder = useCallback(
    async (id: string, updatedFields: Partial<Order>) => {
      try {
        const response = await authFetch(`${API_URL}/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        await response.json();

        // setOrders(prevOrders =>
        //   prevOrders.map(order =>
        //     order._id === id ? updatedOrder : order
        //   )
        // );
        await fetchOrders(); // Re-fetch all orders to ensure consistency

        showToast('Orden actualizada con éxito.');
      } catch (error) {
        console.error('Error updating order:', error);
        showToast('Error al actualizar la orden.', 'error');
        throw error;
      }
    },
    [showToast, authFetch],
  );

  const handleOrderCreated = async (
    orderData: Omit<Order, 'id' | '_id' | 'status' | 'creationDate' | 'payments' | 'notes'>,
  ): Promise<Order | undefined> => {
    try {
      const response = await authFetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const addedOrder = await response.json();
      // setOrders(prevOrders => [addedOrder, ...prevOrders]); // Remove direct state update
      await fetchOrders(); // Re-fetch all orders to ensure consistency
      return addedOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      showToast(`Error al crear la orden: ${error}`, 'error');
      throw error;
    }
  };

  const addPaymentToOrder = async (
    orderId: string,
    amount: number,
    description: string,
  ): Promise<void> => {
    const newPayment: Omit<Payment, '_id'> = {
      amount: parseFloat(String(amount)),
      date: new Date().toISOString(),
      description: description || 'Pago',
    };
    try {
      const response = await authFetch(`${API_URL}/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      await response.json();

      // setOrders(prevOrders =>
      //   prevOrders.map(order =>
      //     order._id === orderId ? updatedOrder : order
      //   )
      // );
      await fetchOrders(); // Re-fetch all orders to ensure consistency

      showToast('Pago añadido con éxito.', 'success');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to add payment:', error);
      showToast('Error al añadir pago.', 'error');
      throw error;
    }
  };

  const updatePaymentInOrder = async (
    orderId: string,
    paymentId: string,
    paymentData: Partial<Payment>,
  ): Promise<void> => {
    try {
      const response = await authFetch(`${API_URL}/orders/${orderId}/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      await response.json();
      // setOrders(prevOrders =>
      //   prevOrders.map(order =>
      //     order._id === orderId ? updatedOrder : order
      //   )
      // );
      await fetchOrders(); // Re-fetch all orders to ensure consistency
      showToast('Abono actualizado con éxito.', 'success');
    } catch (error) {
      console.error('Failed to update payment:', error);
      showToast('Error al actualizar el abono.', 'error');
      throw error;
    }
  };

  const deletePaymentFromOrder = async (orderId: string, paymentId: string): Promise<void> => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este abono?')) {
      try {
        const response = await authFetch(`${API_URL}/orders/${orderId}/payments/${paymentId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        await response.json();
        // setOrders(prevOrders =>
        //   prevOrders.map(order =>
        //     order._id === orderId ? updatedOrder : order
        //   )
        // );
        await fetchOrders(); // Re-fetch all orders to ensure consistency
        showToast('Abono eliminado con éxito.', 'success');
      } catch (error) {
        console.error('Failed to delete payment:', error);
        showToast('Error al eliminar el abono.', 'error');
        throw error;
      }
    }
  };

  const handleSaveNote = async (orderId: string, noteText: string): Promise<void> => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;
    const newNote: Omit<Note, '_id'> = {
      text: noteText,
      timestamp: new Date().toISOString(),
      author: currentUser?.username || 'Usuario',
    };
    try {
      const response = await authFetch(`${API_URL}/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await response.json();
      // setOrders(prevOrders => prevOrders.map(o => o._id === orderId ? updatedOrder : o));
      await fetchOrders(); // Re-fetch all orders to ensure consistency
      showToast('Nota añadida con éxito.', 'success');
    } catch (error) {
      console.error('Failed to save note:', error);
      showToast('Error al añadir nota.', 'error');
      throw error;
    }
  };

  const handleUpdateNote = async (
    orderId: string,
    noteId: string,
    newText: string,
  ): Promise<void> => {
    try {
      const response = await authFetch(`${API_URL}/orders/${orderId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await response.json();
      // setOrders(prevOrders => prevOrders.map(o => o._id === orderId ? updatedOrder : o));
      await fetchOrders(); // Re-fetch all orders to ensure consistency
      showToast('Nota actualizada con éxito.', 'success');
    } catch (error) {
      console.error('Failed to update note:', error);
      showToast('Error al actualizar la nota.', 'error');
      throw error;
    }
  };

  const handleDeleteNote = async (orderId: string, noteId: string): Promise<void> => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      try {
        const response = await authFetch(`${API_URL}/orders/${orderId}/notes/${noteId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        await response.json();
        // setOrders(prevOrders => prevOrders.map(o => o._id === orderId ? updatedOrder : o));
        await fetchOrders(); // Re-fetch all orders to ensure consistency
        showToast('Nota eliminada con éxito.', 'success');
      } catch (error) {
        console.error('Failed to delete note:', error);
        showToast('Error al eliminar la nota.', 'error');
        throw error;
      }
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order['status'],
    completionDate: string | null = null,
  ): Promise<void> => {
    const updateFields: Partial<Order> = { status: newStatus };
    if (newStatus === 'Completado') {
      updateFields.completionDate = completionDate || new Date().toISOString();
    }
    await handleUpdateOrder(orderId, updateFields);
    fetchNotifications();
  };

  const handleDeleteOrder = async (id: string): Promise<string | void> => {
    if (
      window.confirm(
        '¿Estás seguro de que quieres eliminar esta orden? Esta acción es irreversible.',
      )
    ) {
      try {
        const response = await authFetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        await fetchOrders();
        return id;
      } catch (error) {
        console.error('Error deleting order:', error);
        showToast('Error al eliminar la orden.', 'error');
      }
    }
  };

  const generateReceiptPDF = async (order: Order): Promise<void> => {
    try {
      const response = await authFetch(`${API_URL}/orders/${order._id}/receipt`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.orderNumber}-Recibo.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Recibo descargado.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error al generar el recibo PDF.', 'error');
    }
  };

  const generatePaymentHistoryPDF = async (order: Order): Promise<void> => {
    try {
      const response = await authFetch(`${API_URL}/orders/${order._id}/payment-history-pdf`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.orderNumber}-HistorialDePagos.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Historial de pagos descargado.');
    } catch (error) {
      console.error('Error generating payment history PDF:', error);
      showToast('Error al generar el historial de pagos PDF.', 'error');
    }
  };

  const confirmCompletion = async (order: Order, paymentAmount: number): Promise<void> => {
    if (!order) return;
    try {
      if (paymentAmount > 0) {
        await addPaymentToOrder(order._id, paymentAmount, 'Pago al completar');
      }
      await handleUpdateOrderStatus(order._id, 'Completado');
      const balance = calculateBalance(order) - paymentAmount;
      if (balance > 0) {
        showToast(`Orden completada con saldo pendiente de ${balance.toFixed(2)}.`, 'info');
      } else {
        showToast('Orden completada y pagada.', 'success');
      }
    } catch (error) {
      console.error('Error confirming completion:', error);
      showToast('Error al confirmar la finalización.', 'error');
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        fetchOrders,
        isDataLoaded,
        showNotification: showToast,
        currentUser,
        handleOrderCreated,
        calculateBalance,
        addPaymentToOrder,
        updatePaymentInOrder,
        deletePaymentFromOrder,
        handleSaveNote,
        handleUpdateNote,
        handleDeleteNote,
        handleUpdateOrderStatus,
        handleDeleteOrder,
        handleUpdateOrder,
        generateReceiptPDF,
        generatePaymentHistoryPDF,
        confirmCompletion,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === null) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};