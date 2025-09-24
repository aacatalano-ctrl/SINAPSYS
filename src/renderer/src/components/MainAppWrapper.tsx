import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOrders } from '../context/OrderContext';
import { useUI } from '../context/UIContext';
import { useDoctors } from '../context/DoctorContext';
import Sidebar from './Sidebar';
import DoctorsView from './DoctorsView';
import ExistingOrdersView from './ExistingOrdersView';
import HistoryOrdersView from './HistoryOrdersView';
import CreateOrderView from './CreateOrderView';
import OrderDetailsView from './OrderDetailsView';
import DoctorDetailsView from './DoctorDetailsView';
import JobTypeDetailsView from './JobTypeDetailsView';
import ReportResultsView from './ReportResultsView';
import IncomeBreakdownView from './IncomeBreakdownView';
import ReportsView from './ReportsView';
import NotificationsView from './NotificationsView'; // Import new view
import UsersAdminView from './UsersAdminView'; // Import admin view
import AddDoctorModal from './AddDoctorModal';
import AddNoteModal from './AddNoteModal';
import AddPaymentModal from './AddPaymentModal';
import ConfirmCompletionModal from './ConfirmCompletionModal';
import EditOrderModal from './EditOrderModal';
import Toast from './Toast';
import { Doctor, Order, Notification, User } from '../../types';
import { formatDate, formatDateTime, jobTypePrefixMap, jobTypeCosts } from '../utils/helpers';

const API_URL = '/api';

interface MainAppWrapperProps {
  handleLogout: () => void;
  currentUser: User; // Changed from any to User
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const MainAppWrapper: React.FC<MainAppWrapperProps> = ({ handleLogout, currentUser, authFetch }) => {
  const { orders, addOrder, updateOrder, fetchOrders, addPaymentToOrder, handleSaveNote, exportOrdersToExcel, generateReport, fetchReports, fetchOrdersByDoctor, fetchOrdersByPatient, fetchOrdersByDateRange, fetchOrdersByStatus, fetchOrdersByJobType, fetchOrdersBySearchTerm, calculateBalance, sortOrdersColumn, sortOrdersDirection, handleSortOrders, handleDeleteOrder, handleUpdateOrderStatus, generatePaymentHistoryPDF } = useOrders();
  const { isAddDoctorModalOpen, isAddNoteModalOpen, isAddPaymentModalOpen, isConfirmCompletionModalOpen, isEditOrderModalOpen, toast, openAddDoctorModal: _openAddDoctorModal, closeAddDoctorModal: _closeAddDoctorModal, openAddNoteModal, closeAddNoteModal, openAddPaymentModal, closeAddPaymentModal, openConfirmCompletionModal, closeConfirmCompletionModal, openEditOrderModal, closeEditOrderModal, showToast, hideToast } = useUI();
  const { doctors, addDoctor, updateDoctor, deleteDoctor, fetchDoctors, exportDoctors, editingDoctor, setEditingDoctor } = useDoctors();

  const [activeView, _setActiveView] = useState<string>('createOrder');
  const [, setViewHistory] = useState<string[]>(['existingOrders']); // Renamed viewHistory to _viewHistory

  const handleSetActiveView = useCallback((view: string) => {
    _setActiveView(view);
    setViewHistory(prevHistory => {
      if (prevHistory[prevHistory.length - 1] !== view) {
        return [...prevHistory, view];
      }
      return prevHistory;
    });
  }, []);

  const goBack = useCallback(() => {
    setViewHistory(prevHistory => {
      if (prevHistory.length > 1) {
        const newHistory = prevHistory.slice(0, prevHistory.length - 1);
        _setActiveView(newHistory[newHistory.length - 1]);
        return newHistory;
      }
      return prevHistory; // Stay on the current view if no history
    });
  }, []);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<object | null>(null);
  const [searchDoctorTerm, setSearchDoctorTerm] = useState<string>('');
  const [searchHistoryTerm, setSearchHistoryTerm] = useState<string>('');
  const [prefixFilter, setPrefixFilter] = useState<string>('all');
  const [sortDoctorsColumn, setSortDoctorsColumn] = useState<string>('');
  const [sortDoctorsDirection, setSortDoctorsDirection] = useState<'asc' | 'desc'>('asc');
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [reportTimeframe, setReportTimeframe] = useState<string>('all');
  const resolveAddDoctorPromise = useRef<((id: string | null) => void) | null>(null);

  const openAddDoctorModal = useCallback(() => {
    return new Promise<string | null>(resolve => {
      resolveAddDoctorPromise.current = resolve;
      _openAddDoctorModal();
    });
  }, [_openAddDoctorModal]);

  const closeAddDoctorModal = useCallback(() => {
    _closeAddDoctorModal();
    if (resolveAddDoctorPromise.current) {
      resolveAddDoctorPromise.current(null);
      resolveAddDoctorPromise.current = null;
    }
  }, [_closeAddDoctorModal]);
  
  // --- Notifications State and Handlers ---
  const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = useCallback(async () => {
    try {
      const fetchedNotifications = await authFetch(`${API_URL}/notifications`).then(res => res.json());
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [authFetch]); // Removed API_URL from dependencies as it's a constant

  const handleMarkNotificationsAsRead = useCallback(async () => {
    try {
      await authFetch(`${API_URL}/notifications/mark-all-read`, { method: 'PUT' });
      fetchNotifications(); // Refresh notifications list
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }, [fetchNotifications, authFetch]); // Removed API_URL from dependencies as it's a constant

  const handleClearAllNotifications = useCallback(async () => {
    try {
      await authFetch(`${API_URL}/notifications`, { method: 'DELETE' });
      fetchNotifications(); // Refresh to show empty list
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, [fetchNotifications, authFetch]); // Removed API_URL from dependencies as it's a constant

  const handleDeleteNotification = useCallback(async (id: string) => {
    try {
      await authFetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications(); // Refresh notifications list
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, [fetchNotifications, authFetch]); // Removed API_URL from dependencies as it's a constant

  const handleNotificationClick = (notification: Notification) => {
    const order = orders.find(o => o._id === notification.orderId);
    if (order) {
      handleViewOrderDetails(order);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchNotifications();
    fetchOrders(); // Add this line to fetch orders on initial load
  }, [fetchDoctors, fetchNotifications, fetchOrders]);

  // Refresh notifications when orders change to catch new ones
  useEffect(() => {
    fetchNotifications();
  }, [orders, fetchNotifications]);

  // Other useEffects...
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(o => o._id === selectedOrder._id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrder]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Check for open modals first
        if (isAddDoctorModalOpen) {
          closeAddDoctorModal();
        } else if (isEditOrderModalOpen) {
          closeEditOrderModal();
        } else if (isAddNoteModalOpen) {
          closeAddNoteModal();
        } else if (isAddPaymentModalOpen) {
          closeAddPaymentModal();
        } else if (isConfirmCompletionModalOpen) {
          closeConfirmCompletionModal();
        } else {
          // If no modals are open, go back in view history
          goBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isAddDoctorModalOpen, closeAddDoctorModal,
    isEditOrderModalOpen, closeEditOrderModal,
    isAddNoteModalOpen, closeAddNoteModal,
    isAddPaymentModalOpen, closeAddPaymentModal,
    isConfirmCompletionModalOpen, closeConfirmCompletionModal,
    goBack // Include goBack in dependencies
  ]);

  const handleSortDoctors = (column: string) => {
    if (sortDoctorsColumn === column) {
      setSortDoctorsDirection(sortDoctorsDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortDoctorsColumn(column);
      setSortDoctorsDirection('asc');
    }
  };

  const setFullDoctorView = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    handleSetActiveView('doctorDetails');
  };

  const setFullJobTypeView = (jobType: string) => {
    setSelectedJobType(jobType);
    handleSetActiveView('jobTypeDetails');
  };

  const getDoctorFullNameById = (doctorId: string | Doctor) => { // Changed type from any
    if (doctorId && typeof doctorId === 'object' && doctorId.firstName && doctorId.lastName) {
      return `${doctorId.firstName} ${doctorId.lastName}`;
    } else if (typeof doctorId === 'string') {
      // Fallback for cases where doctorId might still be just an ID string (less likely now)
      const doctor = doctors.find((d) => d._id === doctorId);
      return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'N/A';
    }
    return 'N/A';
  };

  const handleViewOrderDetails = (order: Order) => {
    console.log("Viewing details for order ID:", order.orderNumber);
    setSelectedOrder(order);
    handleSetActiveView('orderDetails');
  };

  const handleViewDoctorDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    handleSetActiveView('doctorDetails');
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    openEditOrderModal();
  };

  const mainContent = () => {
    switch (activeView) {
      case 'usersAdmin':
        return currentUser.role === 'admin' ? <UsersAdminView authFetch={authFetch} /> : <div className="py-4 text-center text-red-500">Acceso denegado.</div>;
      case 'notifications':
        return (
          <NotificationsView 
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            onClearNotifications={handleClearAllNotifications}
            onDeleteNotification={handleDeleteNotification}
          />
        );
      case 'doctors':
        return (
          <DoctorsView
            doctors={doctors}
            editingDoctor={editingDoctor}
            setEditingDoctor={setEditingDoctor}
            handleEditDoctor={updateDoctor}
            handleDeleteDoctor={deleteDoctor}
            searchDoctorTerm={searchDoctorTerm}
            setSearchDoctorTerm={setSearchDoctorTerm}
            prefixFilter={prefixFilter}
            setPrefixFilter={setPrefixFilter}
            sortDoctorsColumn={sortDoctorsColumn}
            sortDoctorsDirection={sortDoctorsDirection}
            handleSortDoctors={handleSortDoctors}
            setFullDoctorView={handleViewDoctorDetails}
            onExportDoctors={exportDoctors}
          />
        );
      case 'existingOrders':
        return (
          <ExistingOrdersView
            orders={orders.filter(o => o.status !== 'Completado')}
            onViewDetails={handleViewOrderDetails}
            onEditOrder={handleEditOrder}
            onConfirmCompletion={(order) => {
              console.log("Setting order to complete with ID:", order._id);
              setOrderToComplete(order);
              openConfirmCompletionModal();
            }}
            onConfirmPayment={(order) => {
              setSelectedOrderForPayment(order);
              openAddPaymentModal();
            }}
            onAddNote={(orderId) => {
              const order = orders.find(o => o._id === orderId);
              if (order) {
                setSelectedOrder(order);
                openAddNoteModal();
              }
            }}
            getDoctorFullNameById={getDoctorFullNameById}
            fetchOrdersByDoctor={fetchOrdersByDoctor}
            fetchOrdersByPatient={fetchOrdersByPatient}
            fetchOrdersByDateRange={fetchOrdersByDateRange}
            fetchOrdersByStatus={fetchOrdersByStatus}
            fetchOrdersByJobType={fetchOrdersByJobType}
            fetchOrdersBySearchTerm={fetchOrdersBySearchTerm}
            exportOrdersToExcel={exportOrdersToExcel}
            onDeleteOrder={handleDeleteOrder}
          />
        );
      case 'historyOrders':
        return (
          <HistoryOrdersView
            orders={orders.filter(o => o.status === 'Completado')}
            searchHistoryTerm={searchHistoryTerm}
            setSearchHistoryTerm={setSearchHistoryTerm}
            setFullClientView={handleViewOrderDetails} // Corrected prop name
            getDoctorFullNameById={getDoctorFullNameById}
            formatDate={formatDate}
            sortOrdersColumn={sortOrdersColumn}
            sortOrdersDirection={sortOrdersDirection}
            handleSortOrders={handleSortOrders}
            calculateBalance={calculateBalance}
            handleDeleteOrder={handleDeleteOrder}
          />
        );
      case 'createOrder':
        return (
          <CreateOrderView
            doctors={doctors}
            onOrderCreated={(newOrder) => {
              addOrder(newOrder);
              handleSetActiveView('existingOrders');
            }}
            onAddDoctor={openAddDoctorModal}
          />
        );
      case 'reports':
        return (
          <ReportsView
            orders={orders}
            calculateBalance={calculateBalance}
            doctors={doctors}
            jobTypePrefixMap={jobTypePrefixMap}
            jobTypeCosts={jobTypeCosts}
            reportTimeframe={reportTimeframe}
            setReportTimeframe={setReportTimeframe}
            setFullDoctorView={setFullDoctorView}
            setFullJobTypeView={setFullJobTypeView}
            setReportFilter={setReportFilter}
            setActiveView={handleSetActiveView} // Use the new handler
            generateReport={generateReport}
            fetchReports={fetchReports}
          />
        );
      case 'orderDetails':
        return selectedOrder ? (
          <OrderDetailsView
            order={selectedOrder}
            onBack={goBack}
            onEditOrder={handleEditOrder}
            onAddPayment={(order) => {
              setSelectedOrderForPayment(order);
              openAddPaymentModal();
            }}
            onAddNote={openAddNoteModal}
            getDoctorFullNameById={getDoctorFullNameById}
            calculateBalance={calculateBalance}
            onUpdateStatus={handleUpdateOrderStatus}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            currentUser={currentUser}
            generatePaymentHistoryPDF={generatePaymentHistoryPDF}
          />
        ) : null;
      case 'doctorDetails':
        return selectedDoctor ? (
          <DoctorDetailsView
            doctor={selectedDoctor}
            orders={orders.filter(o => o.doctorId === selectedDoctor.id)}
            onBack={goBack}
            onViewOrderDetails={handleViewOrderDetails}
          />
        ) : null;
      case 'jobTypeDetails':
        return selectedJobType ? (
          <JobTypeDetailsView
            jobType={selectedJobType}
            orders={orders.filter(o => o.jobType === selectedJobType)}
            onBack={goBack}
            onViewOrderDetails={handleViewOrderDetails}
            getDoctorFullNameById={getDoctorFullNameById}
            calculateBalance={calculateBalance}
            formatDate={formatDate}
          />
        ) : null;
      case 'reportResults':
        return reportFilter ? (
          <ReportResultsView
            title={reportFilter.type} // Assuming reportFilter.type holds the title
            orders={orders} // Pass all orders, filtering will happen inside ReportResultsView
            onBack={goBack}
            getDoctorFullNameById={getDoctorFullNameById}
            formatDate={formatDate}
            calculateBalance={calculateBalance}
          />
        ) : null;
      case 'incomeBreakdown':
        return (
          <IncomeBreakdownView
            orders={orders}
            timeframe={reportTimeframe}
            setTimeframe={setReportTimeframe}
            onBack={goBack}
          />
        );
        // Other cases...
      default:
        return <div />; // Fallback
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentView={activeView} 
        setCurrentView={handleSetActiveView} 
        notifications={notifications} 
        markNotificationsAsRead={handleMarkNotificationsAsRead} 
        handleLogout={handleLogout} 
        currentUser={currentUser}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-6">
          {mainContent()}
        </main>
      </div>

      {isAddDoctorModalOpen && (
        <AddDoctorModal
          isOpen={isAddDoctorModalOpen}
          onClose={closeAddDoctorModal}
          onAddDoctor={addDoctor}
          onEditDoctor={updateDoctor}
          doctorToEdit={selectedDoctor}
          showToast={showToast}
          onDoctorAdded={(doctor) => {
            if (resolveAddDoctorPromise.current) {
              resolveAddDoctorPromise.current(doctor._id);
              resolveAddDoctorPromise.current = null;
            }
          }}
        />
      )}
      {isEditOrderModalOpen && selectedOrder && (
        <EditOrderModal
          isOpen={isEditOrderModalOpen}
          onClose={closeEditOrderModal}
          order={selectedOrder}
          onUpdateOrder={updateOrder}
          doctors={doctors}
          jobTypePrefixMap={jobTypePrefixMap}
          jobTypeCosts={jobTypeCosts}
        />
      )}
      {isAddNoteModalOpen && selectedOrder && (
        <AddNoteModal
          order={selectedOrder}
          onClose={closeAddNoteModal}
          onSaveNote={(note) => handleSaveNote(selectedOrder._id, note)}
        />
      )}
      {isAddPaymentModalOpen && selectedOrderForPayment && (
        <AddPaymentModal
          isOpen={isAddPaymentModalOpen}
          onClose={closeAddPaymentModal}
          order={selectedOrderForPayment}
          onAddPayment={(amount, description) => addPaymentToOrder(selectedOrderForPayment._id, amount, description)}
        />
      )}
      {isConfirmCompletionModalOpen && orderToComplete && (
        <ConfirmCompletionModal
          isOpen={isConfirmCompletionModalOpen}
          onClose={closeConfirmCompletionModal}
          order={orderToComplete}
        />
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default MainAppWrapper;
