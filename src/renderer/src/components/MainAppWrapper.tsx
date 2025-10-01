import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useUI } from '../context/UIContext';
import { useDoctors } from '../context/DoctorContext';
import Sidebar from './Sidebar';
const DoctorsView = lazy(() => import('./DoctorsView'));
const ExistingOrdersView = lazy(() => import('./ExistingOrdersView'));
const HistoryOrdersView = lazy(() => import('./HistoryOrdersView'));
const CreateOrderView = lazy(() => import('./CreateOrderView'));
const OrderDetailsView = lazy(() => import('./OrderDetailsView'));
const DoctorDetailsView = lazy(() => import('./DoctorDetailsView'));
const JobTypeDetailsView = lazy(() => import('./JobTypeDetailsView'));
const ReportResultsView = lazy(() => import('./ReportResultsView'));
const IncomeBreakdownView = lazy(() => import('./IncomeBreakdownView'));
const ReportsView = lazy(() => import('./ReportsView'));
const NotificationsView = lazy(() => import('./NotificationsView'));
const UsersAdminView = lazy(() => import('./UsersAdminView'));
import AddDoctorModal from './AddDoctorModal';
import AddNoteModal from './AddNoteModal';
import AddPaymentModal from './AddPaymentModal';
import ConfirmCompletionModal from './ConfirmCompletionModal';
import EditOrderModal from './EditOrderModal';
import Toast from './Toast';
import { Doctor, Order, Notification, User } from '../../types';
import { formatDate, formatDateTime } from '../utils/helpers';

const API_URL = '/api';

interface MainAppWrapperProps {
  currentUser: User;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const MainAppWrapper: React.FC<MainAppWrapperProps> = ({ currentUser, authFetch }) => {
  const navigate = useNavigate();
  const { orders, addOrder, handleUpdateOrder: updateOrder, fetchOrders, addPaymentToOrder, handleSaveNote, exportOrdersToExcel, generateReport, fetchReports, fetchOrdersByDoctor, fetchOrdersByPatient, fetchOrdersByDateRange, fetchOrdersByStatus, fetchOrdersByJobType, fetchOrdersBySearchTerm, calculateBalance, sortOrdersColumn, sortOrdersDirection, handleSortOrders, handleDeleteOrder, handleUpdateOrderStatus, generatePaymentHistoryPDF } = useOrders();
  const { isAddDoctorModalOpen, isAddNoteModalOpen, isAddPaymentModalOpen, isConfirmCompletionModalOpen, isEditOrderModalOpen, toast, openAddDoctorModal: _openAddDoctorModal, closeAddDoctorModal: _closeAddDoctorModal, openAddNoteModal, closeAddNoteModal, openAddPaymentModal, closeAddPaymentModal, openConfirmCompletionModal, closeConfirmCompletionModal, openEditOrderModal, closeEditOrderModal, showToast, hideToast, notifications, fetchNotifications, handleMarkNotificationsAsRead, handleClearAllNotifications, handleDeleteNotification, handleLogout } = useUI();
  const { doctors, addDoctor, updateDoctor, deleteDoctor, fetchDoctors, exportDoctors, editingDoctor, setEditingDoctor } = useDoctors();

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
  const [jobCategories, setJobCategories] = useState([]);
  const [jobTypeCosts, setJobTypeCosts] = useState({});
  const [jobTypePrefixMap, setJobTypePrefixMap] = useState({});
  const resolveAddDoctorPromise = useRef<((id: string | null) => void) | null>(null);

  const fetchJobCategories = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/job-categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch job categories');
      }
      const data = await response.json();
      setJobCategories(data.jobCategories || []);
      setJobTypeCosts(data.jobTypeCosts || {});
      setJobTypePrefixMap(data.jobTypePrefixMap || {});
    } catch (error) {
      console.error(error);
      showToast('Error al cargar las categorías de trabajo.', 'error');
    }
  }, [authFetch, showToast]);

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

  const handleNotificationClick = (notification: Notification) => {
    const order = orders.find(o => o._id === notification.orderId);
    if (order) {
      setSelectedOrder(order);
      navigate('/orders/details');
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchNotifications();
    fetchOrders();
    fetchJobCategories();
  }, [fetchDoctors, fetchNotifications, fetchOrders, fetchJobCategories]);

  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(o => o._id === selectedOrder._id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrder]);

  const handleSortDoctors = (column: string) => {
    if (sortDoctorsColumn === column) {
      setSortDoctorsDirection(sortDoctorsDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortDoctorsColumn(column);
      setSortDoctorsDirection('asc');
    }
  };

  const getDoctorFullNameById = (doctorId: string | Doctor) => {
    if (doctorId && typeof doctorId === 'object' && doctorId.firstName && doctorId.lastName) {
      return `${doctorId.firstName} ${doctorId.lastName}`;
    } else if (typeof doctorId === 'string') {
      const doctor = doctors.find((d) => d._id === doctorId);
      return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'N/A';
    }
    return 'N/A';
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    openEditOrderModal();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentUser={currentUser}
        handleLogout={handleLogout}
        notifications={notifications}
        markNotificationsAsRead={handleMarkNotificationsAsRead}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-6">
                    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div></div>}>
            <Routes>
              <Route path="/" element={<CreateOrderView doctors={doctors} jobCategories={jobCategories} jobTypeCosts={jobTypeCosts} onOrderCreated={async (newOrder) => { const order = await addOrder(newOrder); if(order) navigate('/orders'); }} onAddDoctor={openAddDoctorModal} />} />
              <Route path="/orders" element={<ExistingOrdersView orders={orders.filter(o => o.status !== 'Completado')} onViewDetails={(order) => { setSelectedOrder(order); navigate('/orders/details'); }} onEditOrder={handleEditOrder} onConfirmCompletion={(order) => { setOrderToComplete(order); openConfirmCompletionModal(); }} onConfirmPayment={(order) => { setSelectedOrderForPayment(order); openAddPaymentModal(); }} onAddNote={(orderId) => { const order = orders.find(o => o._id === orderId); if (order) { setSelectedOrder(order); openAddNoteModal(); } }} getDoctorFullNameById={getDoctorFullNameById} onDeleteOrder={handleDeleteOrder} />} />
              <Route path="/history" element={<HistoryOrdersView orders={orders.filter(o => o.status === 'Completado')} searchHistoryTerm={searchHistoryTerm} setSearchHistoryTerm={setSearchHistoryTerm} setFullClientView={(order) => { setSelectedOrder(order); navigate('/orders/details'); }} getDoctorFullNameById={getDoctorFullNameById} formatDate={formatDate} sortOrdersColumn={sortOrdersColumn} sortOrdersDirection={sortOrdersDirection} handleSortOrders={handleSortOrders} calculateBalance={calculateBalance} handleDeleteOrder={handleDeleteOrder} />} />
                          <Route path="/doctors" element={<DoctorsView doctors={doctors} editingDoctor={editingDoctor} setEditingDoctor={setEditingDoctor} handleEditDoctor={updateDoctor} handleDeleteDoctor={deleteDoctor} searchDoctorTerm={searchDoctorTerm} setSearchDoctorTerm={setSearchDoctorTerm} prefixFilter={prefixFilter} setPrefixFilter={setPrefixFilter} sortDoctorsColumn={sortDoctorsColumn} sortDoctorsDirection={sortDoctorsDirection} handleSortDoctors={handleSortDoctors} setFullDoctorView={(doctor) => { setSelectedDoctor(doctor); navigate('/doctors/details'); }} onExportDoctors={exportDoctors} />} />
              <Route path="/reports" element={<ReportsView orders={orders} calculateBalance={calculateBalance} doctors={doctors} jobTypePrefixMap={jobTypePrefixMap} jobTypeCosts={jobTypeCosts} reportTimeframe={reportTimeframe} setReportTimeframe={setReportTimeframe} setFullDoctorView={(doctor) => { setSelectedDoctor(doctor); navigate('/doctors/details'); }} setFullJobTypeView={(jobType) => { setSelectedJobType(jobType); navigate('/reports/job-type'); }} setReportFilter={setReportFilter} setCurrentView={(view) => navigate(view === 'incomeBreakdown' ? '/income-breakdown' : '/reports/results')} />} />
              <Route path="/notifications" element={<NotificationsView notifications={notifications} onNotificationClick={handleNotificationClick} onClearNotifications={handleClearAllNotifications} onDeleteNotification={handleDeleteNotification} currentUser={currentUser} />} />
              <Route path="/admin/users" element={currentUser.role === 'admin' ? <UsersAdminView authFetch={authFetch} /> : <div>Acceso denegado.</div>} />
              <Route path="/orders/details" element={selectedOrder ? <OrderDetailsView order={selectedOrder} onBack={() => navigate(-1)} onEditOrder={handleEditOrder} onConfirmPayment={(order) => { setSelectedOrderForPayment(order); openAddPaymentModal(); }} onAddNote={() => openAddNoteModal()} getDoctorFullNameById={getDoctorFullNameById} formatDate={formatDate} formatDateTime={formatDateTime} currentUser={currentUser} /> : <div>Selecciona una orden para ver los detalles.</div>} />
              <Route path="/doctors/details" element={selectedDoctor ? <DoctorDetailsView doctor={selectedDoctor} onBack={() => navigate(-1)} onViewOrderDetails={(order) => { setSelectedOrder(order); navigate('/orders/details'); }} /> : <div>Selecciona un doctor para ver los detalles.</div>} />
              <Route path="/reports/job-type" element={selectedJobType ? <JobTypeDetailsView jobType={selectedJobType} orders={orders} onBack={() => navigate(-1)} onViewOrderDetails={(order) => { setSelectedOrder(order); navigate('/orders/details'); }} getDoctorFullNameById={getDoctorFullNameById} calculateBalance={calculateBalance} formatDate={formatDate} /> : <div>Selecciona un tipo de trabajo para ver los detalles.</div>} />
              <Route path="/reports/results" element={reportFilter ? <ReportResultsView title={reportFilter.type} orders={orders} onBack={() => navigate(-1)} getDoctorFullNameById={getDoctorFullNameById} formatDate={formatDate} calculateBalance={calculateBalance} /> : <div>Selecciona un reporte para ver los resultados.</div>} />
              <Route path="/income-breakdown" element={<IncomeBreakdownView orders={orders} timeframe={reportTimeframe} setTimeframe={setReportTimeframe} onBack={() => navigate(-1)} />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {isAddDoctorModalOpen && (
        <AddDoctorModal
          isOpen={isAddDoctorModalOpen}
          onClose={closeAddDoctorModal}
          onAddDoctor={addDoctor}
          onEditDoctor={updateDoctor}
          doctorToEdit={editingDoctor}
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
          jobCategories={jobCategories}
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