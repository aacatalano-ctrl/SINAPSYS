import React, { useState, useEffect, useCallback } from 'react';
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
import AddDoctorModal from './AddDoctorModal';
import AddNoteModal from './AddNoteModal';
import AddPaymentModal from './AddPaymentModal';
import ConfirmCompletionModal from './ConfirmCompletionModal';
import EditOrderModal from './EditOrderModal';
import Toast from './Toast';
import { Doctor, Order, Notification } from '../../types';
import { formatDate, formatDateTime, jobTypePrefixMap, jobTypeCosts } from '../utils/helpers';

interface MainAppWrapperProps {
  handleLogout: () => void;
  currentUser: any; // Add currentUser prop
}

const MainAppWrapper: React.FC<MainAppWrapperProps> = ({ handleLogout, currentUser }) => {
  const { orders, addOrder, updateOrder, fetchOrders, addPaymentToOrder, handleSaveNote, exportOrdersToExcel, generateReport, fetchReports, deleteReport, fetchOrdersByDoctor, fetchOrdersByPatient, fetchOrdersByDateRange, fetchOrdersByStatus, fetchOrdersByJobType, fetchOrdersBySearchTerm, calculateBalance, sortOrdersColumn, sortOrdersDirection, handleSortOrders, handleDeleteOrder, handleUpdateOrderStatus } = useOrders();
  const { isAddDoctorModalOpen, isAddNoteModalOpen, isAddPaymentModalOpen, isConfirmCompletionModalOpen, isEditOrderModalOpen, toast, openAddDoctorModal, closeAddDoctorModal, openAddNoteModal, closeAddNoteModal, openAddPaymentModal, closeAddPaymentModal, openConfirmCompletionModal, closeConfirmCompletionModal, openEditOrderModal, closeEditOrderModal, showToast, hideToast } = useUI();
  const { doctors, addDoctor, updateDoctor, deleteDoctor, fetchDoctors, exportDoctors, editingDoctor, setEditingDoctor } = useDoctors();

  const [activeView, _setActiveView] = useState<string>('createOrder');
  const [viewHistory, setViewHistory] = useState<string[]>(['existingOrders']);

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
  
  // --- Notifications State and Handlers ---
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const fetchedNotifications = await window.api.getNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  const handleMarkNotificationsAsRead = useCallback(async () => {
    try {
      await window.api.markNotificationsAsRead();
      fetchNotifications(); // Refresh notifications list
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }, [fetchNotifications]);

  const handleClearAllNotifications = useCallback(async () => {
    try {
      await window.api.clearAllNotifications();
      fetchNotifications(); // Refresh to show empty list
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, [fetchNotifications]);

  const handleDeleteNotification = useCallback(async (id: string) => {
    try {
      await window.api.deleteNotification(id);
      fetchNotifications(); // Refresh notifications list
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, [fetchNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    const order = orders.find(o => o.id === notification.orderId);
    if (order) {
      handleViewOrderDetails(order);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchNotifications();
  }, [fetchDoctors, fetchNotifications]);

  // Refresh notifications when orders change to catch new ones
  useEffect(() => {
    fetchNotifications();
  }, [orders, fetchNotifications]);

  // Other useEffects...
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
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

  const getDoctorFullNameById = (id: string) => {
    const doctor = doctors.find((d) => d.id === id);
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'N/A';
  };

  const handleViewOrderDetails = (order: Order) => {
    console.log("Viewing details for order ID:", order.id);
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

  const getReportResults = () => { /* ... implementation ... */ };

  const mainContent = () => {
    switch (activeView) {
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
              console.log("Setting order to complete with ID:", order.id);
              setOrderToComplete(order);
              openConfirmCompletionModal();
            }}
            onConfirmPayment={(order) => {
              setSelectedOrderForPayment(order);
              openAddPaymentModal();
            }}
            onAddNote={(orderId) => {
              const order = orders.find(o => o.id === orderId);
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
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
          onSaveNote={(note) => handleSaveNote(selectedOrder.id, note)}
        />
      )}
      {isAddPaymentModalOpen && selectedOrderForPayment && (
        <AddPaymentModal
          isOpen={isAddPaymentModalOpen}
          onClose={closeAddPaymentModal}
          order={selectedOrderForPayment}
          onAddPayment={(amount, description) => addPaymentToOrder(selectedOrderForPayment.id, amount, description)}
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