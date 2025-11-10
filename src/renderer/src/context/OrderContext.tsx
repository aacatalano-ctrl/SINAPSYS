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
  generateReceiptPDF: (order: Order, currentUser: User) => Promise<void>;
  generatePaymentHistoryPDF: (order: Order, currentUser: User) => Promise<void>;
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
  const { showToast, fetchNotifications, setIsLoading } = useUI(); // Get setIsLoading from UIContext
  const { isDoctorsLoaded } = useDoctors();

  const API_URL = '/api';

  const withLoading = useCallback(async <T,>(asyncFunc: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true);
    try {
      return await asyncFunc();
    } catch (error) {
      console.error('An error occurred during a withLoading operation:', error);
      showToast('Ocurrió un error. Por favor, intente de nuevo.', 'error');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, showToast]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/orders`, { manualLoading: true }); // Use manualLoading
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
  }, [isDoctorsLoaded, fetchOrders]);

  const calculateBalance = (order: Order): number => {
    if (!order || !order.payments) return order?.cost || 0;
    const totalDeposited = order.payments.reduce((sum, p) => sum + p.amount, 0);
    return order.cost - totalDeposited;
  };

  const handleUpdateOrder = useCallback(
    async (id: string, updatedFields: Partial<Order>) => {
      await withLoading(async () => {
        const response = await authFetch(`${API_URL}/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        await response.json();
        await fetchOrders(); // Re-fetch all orders to ensure consistency
        showToast('Orden actualizada con éxito.');
      });
    },
    [showToast, authFetch, fetchOrders, withLoading],
  );

  const handleOrderCreated = useCallback(
    async (
      orderData: Omit<Order, 'id' | '_id' | 'status' | 'creationDate' | 'payments' | 'notes'>,
    ): Promise<Order | undefined> => {
      return await withLoading(async () => {
        const response = await authFetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const addedOrder = await response.json();
        await fetchOrders(); // Re-fetch all orders to ensure consistency
        return addedOrder;
      });
    },
    [showToast, authFetch, fetchOrders, withLoading],
  );

  const addPaymentToOrder = useCallback(
    async (orderId: string, amount: number, description: string): Promise<void> => {
      await withLoading(async () => {
        const newPayment: Omit<Payment, '_id'> = {
          amount: parseFloat(String(amount)),
          date: new Date().toISOString(),
          description: description || 'Pago',
        };
        const response = await authFetch(`${API_URL}/orders/${orderId}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPayment),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        await response.json();
        await fetchOrders(); // Re-fetch all orders to ensure consistency
        showToast('Pago añadido con éxito.', 'success');
        fetchNotifications();
      });
    },
    [showToast, authFetch, fetchOrders, fetchNotifications, withLoading],
  );

  const updatePaymentInOrder = useCallback(
    async (orderId: string, paymentId: string, paymentData: Partial<Payment>): Promise<void> => {
      await withLoading(async () => {
        const response = await authFetch(`${API_URL}/orders/${orderId}/payments/${paymentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        await response.json();
        await fetchOrders(); // Re-fetch all orders to ensure consistency
        showToast('Abono actualizado con éxito.', 'success');
      });
    },
    [showToast, authFetch, fetchOrders, withLoading],
  );

  const deletePaymentFromOrder = useCallback(
    async (orderId: string, paymentId: string): Promise<void> => {
      if (window.confirm('¿Estás seguro de que quieres eliminar este abono?')) {
        await withLoading(async () => {
          const response = await authFetch(`${API_URL}/orders/${orderId}/payments/${paymentId}`, {
            method: 'DELETE',
            manualLoading: true, // Use manualLoading
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          await response.json();
          await fetchOrders(); // Re-fetch all orders to ensure consistency
          showToast('Abono eliminado con éxito.', 'success');
        });
      }
    },
    [showToast, authFetch, fetchOrders, withLoading],
  );

  const handleSaveNote = useCallback(
    async (orderId: string, noteText: string): Promise<void> => {
      const order = orders.find((o) => o._id === orderId);
      if (!order) return;
      await withLoading(async () => {
        const newNote: Omit<Note, '_id'> = {
          text: noteText,
          timestamp: new Date().toISOString(),
          author: currentUser?.username || 'Usuario',
        };
        const response = await authFetch(`${API_URL}/orders/${orderId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newNote),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        await response.json();
        await fetchOrders(); // Re-fetch all orders to ensure consistency
        showToast('Nota añadida con éxito.', 'success');
      });
    },
    [showToast, authFetch, fetchOrders, orders, currentUser, withLoading],
  );

  const handleUpdateNote = useCallback(
    async (orderId: string, noteId: string, newText: string): Promise<void> => {
      await withLoading(async () => {
        const response = await authFetch(`${API_URL}/orders/${orderId}/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newText }),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        await response.json();
        await fetchOrders(); // Re-fetch all orders to ensure consistency
        showToast('Nota actualizada con éxito.', 'success');
      });
    },
    [showToast, authFetch, fetchOrders, withLoading],
  );

  const handleDeleteNote = useCallback(
    async (orderId: string, noteId: string): Promise<void> => {
      if (window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        await withLoading(async () => {
          const response = await authFetch(`${API_URL}/orders/${orderId}/notes/${noteId}`, {
            method: 'DELETE',
            manualLoading: true, // Use manualLoading
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          await response.json();
          await fetchOrders(); // Re-fetch all orders to ensure consistency
          showToast('Nota eliminada con éxito.', 'success');
        });
      }
    },
    [showToast, authFetch, fetchOrders, withLoading],
  );

  const handleUpdateOrderStatus = useCallback(
    async (
      orderId: string,
      newStatus: 'Pendiente' | 'Procesando' | 'Completado',
      completionDate: string | null = null,
    ): Promise<void> => {
      await withLoading(async () => {
        const updateFields: Partial<Order> = { status: newStatus };
        if (newStatus === 'Completado') {
          updateFields.completionDate = completionDate || new Date().toISOString();
        }
        await handleUpdateOrder(orderId, updateFields); // This calls the wrapped handleUpdateOrder
        fetchNotifications();
      });
    },
    [handleUpdateOrder, fetchNotifications, withLoading],
  );

  const handleDeleteOrder = useCallback(
    async (id: string): Promise<string | void> => {
      if (
        window.confirm(
          '¿Estás seguro de que quieres eliminar esta orden? Esta acción es irreversible.',
        )
      ) {
        return await withLoading(async () => {
          const response = await authFetch(`${API_URL}/orders/${id}`, {
            method: 'DELETE',
            manualLoading: true, // Use manualLoading
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          await fetchOrders();
          showToast('Orden eliminada con éxito.', 'success');
          return id;
        });
      }
      return undefined;
    },
    [showToast, authFetch, fetchOrders, withLoading],
  );

  const generateReceiptPDF = useCallback(
    async (order: Order, currentUser: User): Promise<void> => {
      await withLoading(async () => {
        const response = await authFetch(`${API_URL}/orders/${order._id}/receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order, currentUser }),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${order._id}-Recibo.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('Recibo descargado.', 'success');
      });
    },
    [showToast, authFetch, withLoading],
  );

  const generatePaymentHistoryPDF = useCallback(
    async (order: Order, currentUser: User): Promise<void> => {
      await withLoading(async () => {
        const response = await authFetch(`${API_URL}/orders/${order._id}/payment-history-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUser }),
          manualLoading: true, // Use manualLoading
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
        showToast('Historial de pagos descargado.', 'success');
      });
    },
    [showToast, authFetch, withLoading],
  );

  const confirmCompletion = useCallback(
    async (order: Order, paymentAmount: number): Promise<void> => {
      if (!order) return;
      await withLoading(async () => {
        if (paymentAmount > 0) {
          await addPaymentToOrder(order._id, paymentAmount, 'Pago al completar'); // This calls the wrapped addPaymentToOrder
        }
        await handleUpdateOrderStatus(order._id, 'Completado'); // This calls the wrapped handleUpdateOrderStatus
        const balance = calculateBalance(order) - paymentAmount;
        if (balance > 0) {
          showToast(`Orden completada con saldo pendiente de ${balance.toFixed(2)}.`, 'info');
        } else {
          showToast('Orden completada y pagada.', 'success');
        }
      });
    },
    [addPaymentToOrder, handleUpdateOrderStatus, calculateBalance, showToast, withLoading],
  );

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