import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useUI } from '../context/UIContext';
import { useDoctors } from '../context/DoctorContext';
import Sidebar from './Sidebar';
const UsersAdminView = lazy(() => import('./UsersAdminView'));
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
  const location = useLocation();
  const {
    orders,
    handleUpdateOrder: updateOrder,
    fetchOrders,
    addPaymentToOrder,
    handleSaveNote,
    handleUpdateNote,
    calculateBalance,
    sortOrdersColumn,
    sortOrdersDirection,
    handleSortOrders,
    handleDeleteOrder,
    isDataLoaded,
    handleOrderCreated,
  } = useOrders();
  const {
    isAddDoctorModalOpen,
    isAddNoteModalOpen,
    isAddPaymentModalOpen,
    isConfirmCompletionModalOpen,
    isEditOrderModalOpen,
    toast,
    openAddDoctorModal: _openAddDoctorModal,
    closeAddDoctorModal: _closeAddDoctorModal,
    openAddNoteModal,
    closeAddNoteModal,
    openAddPaymentModal,
    closeAddPaymentModal,
    openConfirmCompletionModal,
    closeConfirmCompletionModal,
    openEditOrderModal,
    closeEditOrderModal,
    showToast,
    hideToast,
    notifications,
    fetchNotifications,
    handleMarkNotificationsAsRead,
    handleClearAllNotifications,
    handleDeleteNotification,
    handleLogout,
    isDatabaseMaintenance,
  } = useUI();
  const {
    doctors,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    fetchDoctors,
    exportDoctors,
    editingDoctor,
    setEditingDoctor,
    isDoctorsLoaded,
  } = useDoctors();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<object | null>(null);
  const [searchDoctorTerm, setSearchDoctorTerm] = useState<string>('');
  const [searchHistoryTerm, setSearchHistoryTerm] = useState<string>('');
  const [prefixFilter, setPrefixFilter] = useState<string>('all');
  const [sortDoctorsColumn, setSortDoctorsColumn] = useState<string>('');
  const [sortDoctorsDirection, setSortDoctorsDirection] = useState<'asc' | 'desc'>('asc');
  const [newlyCreatedOrderId, setNewlyCreatedOrderId] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // true for md and up
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [reportTimeframe, setReportTimeframe] = useState<string>('all');
  const [jobCategories, setJobCategories] = useState([]);
  const [jobTypeCosts, setJobTypeCosts] = useState({});
  const [jobTypePrefixMap, setJobTypePrefixMap] = useState({});
  const resolveAddDoctorPromise = useRef<((id: string | null) => void) | null>(null);

  const isLoading = !isDataLoaded || !isDoctorsLoaded;

  const fetchJobCategories = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await authFetch(`${API_URL}/job-categories`, { signal });
        if (response) {
          const data = await response.json();
          setJobCategories(data.jobCategories || []);
          setJobTypeCosts(data.jobTypeCosts || {});
          setJobTypePrefixMap(data.jobTypePrefixMap || {});
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error(error);
          showToast('Error al cargar las categorías de trabajo.', 'error');
        }
      }
    },
    [authFetch, showToast],
  );

  const openAddDoctorModal = useCallback(() => {
    return new Promise<string | null>((resolve) => {
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
    const order = orders.find((o) => o._id === notification.orderId);
    if (order) {
      setSelectedOrder(order);
      navigate('/orders/details');
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetchDoctors(signal);
    fetchNotifications(signal);
    fetchOrders(signal);
    fetchJobCategories(signal);

    return () => {
      controller.abort();
    };
  }, [fetchDoctors, fetchNotifications, fetchOrders, fetchJobCategories]);

  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find((o) => o._id === selectedOrder._id);
      if (!updatedOrder) {
        setSelectedOrder(null); // Limpiar la orden seleccionada
        // Redirigir si estamos en la vista de detalles de la orden eliminada
        if (location.pathname === '/orders/details') {
          // Asegúrate de tener `location` de `useLocation`
          navigate('/orders');
        }
      } else {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrder, navigate, location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (event.key === 'Escape') {
        navigate('/');
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        navigate(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  useEffect(() => {
    if (newlyCreatedOrderId && orders.find((o) => o._id === newlyCreatedOrderId)) {
      const createdOrder = orders.find((o) => o._id === newlyCreatedOrderId);
      if (createdOrder) {
        showToast(
          <>
            Orden {createdOrder.orderNumber}
            <br />
            creada con éxito.
          </>,
          'success'
        );
      } else {
        showToast('Orden creada con éxito.', 'success'); // Fallback if order not found
      }
      setNewlyCreatedOrderId(null);
    }
  }, [orders, newlyCreatedOrderId, showToast]);

  const handleSortDoctors = (column: string) => {
    if (sortDoctorsColumn === column) {
      setSortDoctorsDirection(sortDoctorsDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortDoctorsColumn(column);
      setSortDoctorsDirection('asc');
    }
  };

  const getDoctorFullNameById = (doctorId: string | Doctor | null | undefined) => {
    // If it's a populated object with an _id, use it directly.
    if (doctorId && typeof doctorId === 'object' && '_id' in doctorId) {
      return `${doctorId.firstName || ''} ${doctorId.lastName || ''}`.trim();
    }
    // If it's a string ID, look it up.
    if (typeof doctorId === 'string') {
      const doctor = doctors.find((d) => d._id === doctorId);
      return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'N/A';
    }
    // Fallback for any other case (null, undefined, etc.)
    return 'N/A';
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    openEditOrderModal();
  };

  const handleOpenAddNoteModal = (orderId: string) => {
    const order = orders.find((o) => o._id === orderId);
    if (order) {
      setSelectedOrder(order);
      setNoteToEdit(null);
      openAddNoteModal();
    }
  };

  const handleOpenEditNoteModal = (note: Note) => {
    setNoteToEdit(note);
    openAddNoteModal();
  };

  return (
    <div className="relative flex h-screen bg-gray-100">
      {isLoading && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-gray-900/75 backdrop-blur-sm">
          <div className="size-20 animate-spin rounded-full border-y-4 border-blue-500"></div>
          <p className="mt-4 text-lg font-semibold text-white">Conectando y cargando datos...</p>
        </div>
      )}

      {isDatabaseMaintenance && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-red-900/75 p-4 text-center text-white backdrop-blur-sm">
          <svg
            className="mb-4 size-20 text-red-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
          <h2 className="mb-2 text-3xl font-bold">¡Atención!</h2>
          <p className="mb-4 text-xl">
            La base de datos está en mantenimiento o no está disponible.
          </p>
          <p className="text-lg">Por favor, intente de nuevo más tarde.</p>
          <p className="mt-4 text-sm">Si el problema persiste, contacte a soporte técnico.</p>
        </div>
      )}

      {/* Hamburger menu for mobile */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button>

      <Sidebar
        currentUser={currentUser}
        handleLogout={handleLogout}
        notifications={notifications}
        markNotificationsAsRead={handleMarkNotificationsAsRead}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-4 md:p-6">
          <Suspense
            fallback={
              <div className="flex size-full items-center justify-center">
                <div className="size-32 animate-spin rounded-full border-y-2 border-blue-600"></div>
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <CreateOrderView
                    doctors={doctors}
                    jobCategories={jobCategories}
                    jobTypeCosts={jobTypeCosts}
                    onOrderCreated={async (newOrder) => {
                      const order = await handleOrderCreated(newOrder);
                      if (order) {
                        setNewlyCreatedOrderId(order._id);
                        navigate('/orders');
                      }
                    }}
                    onAddDoctor={openAddDoctorModal}
                  />
                }
              />
              <Route
                path="/orders"
                element={
                  <ExistingOrdersView
                    orders={orders.filter((o) => o.status !== 'Completado')}
                    onViewDetails={(order) => {
                      setSelectedOrder(order);
                      navigate('/orders/details');
                    }}
                    onEditOrder={handleEditOrder}
                    onConfirmCompletion={(order) => {
                      setOrderToComplete(order);
                      openConfirmCompletionModal();
                    }}
                    onConfirmPayment={(order) => {
                      setSelectedOrderForPayment(order);
                      openAddPaymentModal();
                    }}
                    onAddNote={handleOpenAddNoteModal}
                    getDoctorFullNameById={getDoctorFullNameById}
                    onDeleteOrder={handleDeleteOrder}
                  />
                }
              />
              <Route
                path="/history"
                element={
                  <HistoryOrdersView
                    orders={orders.filter((o) => o.status === 'Completado')}
                    searchHistoryTerm={searchHistoryTerm}
                    setSearchHistoryTerm={setSearchHistoryTerm}
                    setFullClientView={(order) => {
                      setSelectedOrder(order);
                      navigate('/orders/details');
                    }}
                    getDoctorFullNameById={getDoctorFullNameById}
                    formatDate={formatDate}
                    sortOrdersColumn={sortOrdersColumn}
                    sortOrdersDirection={sortOrdersDirection}
                    handleSortOrders={handleSortOrders}
                    calculateBalance={calculateBalance}
                    handleDeleteOrder={handleDeleteOrder}
                  />
                }
              />
              <Route
                path="/doctors"
                element={
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
                    setFullDoctorView={(doctor) => {
                      setSelectedDoctor(doctor);
                      navigate('/doctors/details');
                    }}
                    onExportDoctors={exportDoctors}
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <ReportsView
                    orders={orders}
                    calculateBalance={calculateBalance}
                    doctors={doctors}
                    jobTypePrefixMap={jobTypePrefixMap}
                    jobTypeCosts={jobTypeCosts}
                    reportTimeframe={reportTimeframe}
                    setReportTimeframe={setReportTimeframe}
                    setFullDoctorView={(doctor) => {
                      setSelectedDoctor(doctor);
                      navigate('/doctors/details');
                    }}
                    setFullJobTypeView={(jobType) => {
                      setSelectedJobType(jobType);
                      navigate('/reports/job-type');
                    }}
                    setReportFilter={setReportFilter}
                    setCurrentView={(view) =>
                      navigate(
                        view === 'incomeBreakdown' ? '/income-breakdown' : '/reports/results',
                      )
                    }
                  />
                }
              />
              <Route
                path="/notifications"
                element={
                  <NotificationsView
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onClearNotifications={handleClearAllNotifications}
                    onDeleteNotification={handleDeleteNotification}
                    currentUser={currentUser}
                  />
                }
              />
              <Route
                path="/admin/users"
                element={
                  currentUser.role === 'admin' || currentUser.role === 'master' ? (
                    <UsersAdminView
                      authFetch={authFetch}
                      currentUser={currentUser}
                      showToast={showToast}
                    />
                  ) : (
                    <div>Acceso denegado.</div>
                  )
                }
              />
              <Route
                path="/orders/details"
                element={
                  selectedOrder ? (
                    <OrderDetailsView
                      order={selectedOrder}
                      onBack={() => navigate(-1)}
                      onEditOrder={handleEditOrder}
                      onConfirmPayment={(order) => {
                        setSelectedOrderForPayment(order);
                        openAddPaymentModal();
                      }}
                      onAddNote={() => handleOpenAddNoteModal(selectedOrder._id)}
                      onEditNote={handleOpenEditNoteModal}
                      getDoctorFullNameById={getDoctorFullNameById}
                      formatDate={formatDate}
                      formatDateTime={formatDateTime}
                      currentUser={currentUser}
                    />
                  ) : (
                    <div>Selecciona una orden para ver los detalles.</div>
                  )
                }
              />
              <Route
                path="/doctors/details"
                element={
                  selectedDoctor ? (
                    <DoctorDetailsView
                      doctor={selectedDoctor}
                      onBack={() => navigate(-1)}
                      onViewOrderDetails={(order) => {
                        setSelectedOrder(order);
                        navigate('/orders/details');
                      }}
                    />
                  ) : (
                    <div>Selecciona un doctor para ver los detalles.</div>
                  )
                }
              />
              <Route
                path="/reports/job-type"
                element={
                  selectedJobType ? (
                    <JobTypeDetailsView
                      selectedJobCategory={selectedJobType} // Pass as selectedJobCategory
                      orders={orders}
                      onBack={() => navigate(-1)}
                      onViewOrderDetails={(order) => {
                        setSelectedOrder(order);
                        navigate('/orders/details');
                      }}
                      getDoctorFullNameById={getDoctorFullNameById}
                      calculateBalance={calculateBalance}
                      formatDate={formatDate}
                    />
                  ) : (
                    <div>Selecciona un tipo de trabajo para ver los detalles.</div>
                  )
                }
              />
              <Route
                path="/reports/results"
                element={
                  reportFilter ? (
                    <ReportResultsView
                      title={reportFilter.type}
                      orders={orders}
                      onBack={() => navigate(-1)}
                      getDoctorFullNameById={getDoctorFullNameById}
                      formatDate={formatDate}
                      calculateBalance={calculateBalance}
                    />
                  ) : (
                    <div>Selecciona un reporte para ver los resultados.</div>
                  )
                }
              />
              <Route
                path="/income-breakdown"
                element={
                  <IncomeBreakdownView
                    orders={orders}
                    timeframe={reportTimeframe}
                    setTimeframe={setReportTimeframe}
                    onBack={() => navigate(-1)}
                  />
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>

      {isAddDoctorModalOpen && (
        <AddDoctorModal
          isOpen={isAddDoctorModalOpen}
          onClose={closeAddDoctorModal}
          onAddDoctor={async (doctorData) => {
            await addDoctor(doctorData);
          }}
          onEditDoctor={updateDoctor}
          doctorToEdit={editingDoctor}
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
          jobCategories={jobCategories}
          jobTypePrefixMap={jobTypePrefixMap}
          jobTypeCosts={jobTypeCosts}
        />
      )}
      {isAddNoteModalOpen && selectedOrder && (
        <AddNoteModal
          order={selectedOrder}
          onClose={() => {
            closeAddNoteModal();
            setNoteToEdit(null);
          }}
          onSaveNote={(noteText) => handleSaveNote(selectedOrder._id, noteText)}
          onUpdateNote={(noteId, newText) => handleUpdateNote(selectedOrder._id, noteId, newText)}
          noteToEdit={noteToEdit}
        />
      )}
      {isAddPaymentModalOpen && selectedOrderForPayment && (
        <AddPaymentModal
          isOpen={isAddPaymentModalOpen}
          onClose={closeAddPaymentModal}
          order={selectedOrderForPayment}
          onAddPayment={(amount, description) =>
            addPaymentToOrder(selectedOrderForPayment._id, amount, description)
          }
        />
      )}
      {isConfirmCompletionModalOpen && orderToComplete && (
        <ConfirmCompletionModal
          isOpen={isConfirmCompletionModalOpen}
          onClose={closeConfirmCompletionModal}
          order={orderToComplete}
        />
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} show={toast.show} />}
    </div>
  );
};

export default MainAppWrapper;
