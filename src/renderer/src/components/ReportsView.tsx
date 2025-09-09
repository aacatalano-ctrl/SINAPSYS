import React from 'react';
import { Order } from '../../types';
import { ClipboardList, CheckCircle, Clock, DollarSign, Bell } from 'lucide-react';

interface ReportsViewProps {
  doctors: Doctor[];
  jobTypePrefixMap: { [key: string]: string };
  jobTypeCosts: { [key: string]: number };
  reportTimeframe: string;
  setReportTimeframe: React.Dispatch<React.SetStateAction<string>>;
  setFullDoctorView: (doctor: Doctor) => void;
  setFullJobTypeView: (jobType: string) => void;
  setReportFilter: React.Dispatch<React.SetStateAction<object | null>>;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
  reports: any[];
  generateReport: () => void;
  fetchReports: () => void;
  onViewReportDetails: () => void;
  onDeleteReport: () => void;
  orders: Order[];
  calculateBalance: (order: Order) => number;
}

const ReportsView: React.FC<ReportsViewProps> = ({ doctors, jobTypePrefixMap, reportTimeframe, setReportTimeframe, setFullDoctorView, setFullJobTypeView, setReportFilter, setActiveView, orders, calculateBalance }) => {

  const filterOrdersByTimeframe = (allOrders: Order[], timeframe: string): Order[] => {
    const now = new Date();
    return allOrders.filter((order: Order) => {
      const orderDate = new Date(order.creationDate);
      switch (timeframe) {
        case 'day':
          return orderDate.toDateString() === now.toDateString();
        case 'week': {
          const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59, 999);
          return orderDate >= startOfWeek && orderDate <= endOfWeek;
        }
        case 'month':
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        case 'year':
          return orderDate.getFullYear() === now.getFullYear();
        case 'none':
          return false; // No orders when 'none' is selected
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredOrders = filterOrdersByTimeframe(orders, reportTimeframe);

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl mb-8">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Reportes del Laboratorio</h2>
      </div>

      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setReportTimeframe('day')}
          className={`px-4 py-2 rounded-lg font-semibold ${reportTimeframe === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          Hoy
        </button>
        <button
          onClick={() => setReportTimeframe('week')}
          className={`px-4 py-2 rounded-lg font-semibold ${reportTimeframe === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          Semana
        </button>
        <button
          onClick={() => setReportTimeframe('month')}
          className={`px-4 py-2 rounded-lg font-semibold ${reportTimeframe === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          Mes
        </button>
        <button
          onClick={() => setReportTimeframe('year')}
          className={`px-4 py-2 rounded-lg font-semibold ${reportTimeframe === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          Año
        </button>
        <button
          onClick={() => setReportTimeframe('all')}
          className={`px-4 py-2 rounded-lg font-semibold ${reportTimeframe === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          Todo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer" onClick={() => { setReportFilter({ type: 'TOTAL_ORDERS' }); setActiveView('reportResults'); }}>
          <div>
            <h3 className="text-xl font-semibold text-blue-800">Total de Órdenes</h3>
            <p className="text-3xl font-bold text-blue-900">{filteredOrders.length}</p>
          </div>
          <ClipboardList size={48} className="text-blue-500 opacity-70" />
        </div>

        <div className="bg-green-100 p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer" onClick={() => { setReportFilter({ type: 'COMPLETED_ORDERS' }); setActiveView('reportResults'); }}>
          <div>
            <h3 className="text-xl font-semibold text-green-800">Órdenes Completadas</h3>
            <p className="text-3xl font-bold text-green-900">{filteredOrders.filter(o => o.status === 'Completado').length}</p>
          </div>
          <CheckCircle size={48} className="text-green-500 opacity-70" />
        </div>

        <div className="bg-yellow-100 p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer" onClick={() => { setReportFilter({ type: 'PENDING_ORDERS' }); setActiveView('reportResults'); }}>
          <div>
            <h3 className="text-xl font-semibold text-yellow-800">Órdenes Pendientes</h3>
            <p className="text-3xl font-bold text-yellow-900">{filteredOrders.filter(o => o.status === 'Pendiente' || o.status === 'Procesando').length}</p>
          </div>
          <Clock size={48} className="text-yellow-500 opacity-70" />
        </div>

        <div className="bg-purple-100 p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer" onClick={() => setActiveView('incomeBreakdown')}>
          <div>
            <h3 className="text-xl font-semibold text-purple-800">Ingresos Totales (Monto Abonado)</h3>
            <p className="text-3xl font-bold text-purple-900">${filteredOrders.reduce((sum, order) => sum + order.payments.reduce((pSum, p) => pSum + p.amount, 0), 0).toFixed(2)}</p>
          </div>
          <DollarSign size={48} className="text-purple-500 opacity-70" />
        </div>

        <div className="bg-red-100 p-6 rounded-lg shadow-md flex items-center justify-between cursor-pointer" onClick={() => { setReportFilter({ type: 'PENDING_BALANCE' }); setActiveView('reportResults'); }}>
          <div>
            <h3 className="text-xl font-semibold text-red-800">Saldo Pendiente Total</h3>
            <p className="text-3xl font-bold text-red-900">${filteredOrders.reduce((sum, order) => sum + calculateBalance(order), 0).toFixed(2)}</p>
          </div>
          <Bell size={48} className="text-red-500 opacity-70" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Órdenes por Doctor</h3>
      {doctors.length === 0 ? (
        <p className="text-gray-600">No hay doctores registrados para generar este reporte.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Doctor</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Total Órdenes</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Completadas</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Pendientes/Procesando</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Monto Total Abonado</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Saldo Pendiente del Doctor</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(doctor => {
                const doctorOrders = filteredOrders.filter(order => order.doctorId === doctor.id);
                const totalOrders = doctorOrders.length;
                const completedOrders = doctorOrders.filter(o => o.status === 'Completado').length;
                const pendingOrders = doctorOrders.filter(o => o.status === 'Pendiente' || o.status === 'Procesando').length;
                const totalDepositedByDoctor = doctorOrders.reduce((sum, order) => sum + order.payments.reduce((pSum, p) => pSum + p.amount, 0), 0);
                const totalBalanceByDoctor = doctorOrders.reduce((sum, order) => sum + calculateBalance(order), 0);
                if (totalOrders === 0) return null;
                return (
                  <tr key={doctor.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium cursor-pointer text-blue-600 hover:underline" onClick={() => setFullDoctorView(doctor)}>{doctor.title} {doctor.firstName} {doctor.lastName}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{totalOrders}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{completedOrders}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{pendingOrders}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">${totalDepositedByDoctor.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      <span className={`font-semibold ${totalBalanceByDoctor > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${totalBalanceByDoctor.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Órdenes por Tipo de Trabajo</h3>
      {Object.keys(jobTypePrefixMap).length === 0 ? (
        <p className="text-gray-600">No hay tipos de trabajo definidos.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Tipo de Trabajo</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Total Órdenes</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Costo Total</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Monto Total Abonado</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(jobTypePrefixMap).map(jobType => {
                const jobTypeOrders = filteredOrders.filter(order => order.jobType === jobType);
                const totalOrdersOfType = jobTypeOrders.length;
                const totalCostOfType = jobTypeOrders.reduce((sum, order) => sum + order.cost, 0);
                const totalDepositedOfType = jobTypeOrders.reduce((sum, order) => sum + order.payments.reduce((pSum, p) => pSum + p.amount, 0), 0);
                if (totalOrdersOfType === 0) return null;
                return (
                  <tr key={jobType} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium cursor-pointer text-blue-600 hover:underline" onClick={() => setFullJobTypeView(jobType)}>{jobType}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{totalOrdersOfType}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">${totalCostOfType.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">${totalDepositedOfType.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsView;