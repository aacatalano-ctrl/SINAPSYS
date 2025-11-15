// src/components/JobTypeDetailsView.jsx

import React, { useMemo } from 'react';
import { Order } from '../../types';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { getJobTypeCategory } from '../utils/helpers';

interface JobTypeDetailsViewProps {
  jobType: string | null;
  orders: Order[];
  onBack: () => void;
  getDoctorFullNameById: (id: string) => string;
  formatDate: (dateString: string) => string;
  onViewOrderDetails: (order: Order) => void; // Corrected prop name
  calculateBalance: (order: Order) => number;
  selectedJobCategory: string | null; // New prop
}

const JobTypeDetailsView: React.FC<JobTypeDetailsViewProps> = ({
  jobType, // This will now represent the selected job category
  orders,
  onBack,
  getDoctorFullNameById,
  formatDate,
  onViewOrderDetails,
  calculateBalance,
  selectedJobCategory, // New prop
}) => {
  const filteredOrdersByJobType = selectedJobCategory
    ? orders.filter((order: Order) =>
        order.jobItems.some((item) => getJobTypeCategory(item.jobType) === selectedJobCategory),
      )
    : [];

  const aggregatedJobTypeData = useMemo(() => {
    const data: {
      [jobType: string]: {
        totalUnits: number;
        totalCost: number;
        totalDeposited: number;
      };
    } = {};

    filteredOrdersByJobType.forEach((order) => {
      const orderTotalCost = order.jobItems.reduce((sum, item) => sum + (item.cost * (item.units || 1)), 0);
      const orderTotalDeposited = order.payments.reduce((sum, p) => sum + p.amount, 0);

      order.jobItems.forEach((item) => {
        if (getJobTypeCategory(item.jobType) === selectedJobCategory) {
          if (!data[item.jobType]) {
            data[item.jobType] = {
              totalUnits: 0,
              totalCost: 0,
              totalDeposited: 0,
            };
          }
          data[item.jobType].totalUnits += item.units || 1;
          data[item.jobType].totalCost += item.cost * (item.units || 1);

          // Calculate proportional deposited amount
          if (orderTotalCost > 0) {
            const itemCost = item.cost * (item.units || 1);
            const proportionalDeposited = (itemCost / orderTotalCost) * orderTotalDeposited;
            data[item.jobType].totalDeposited += proportionalDeposited;
          }
        }
      });
    });
    return data;
  }, [filteredOrdersByJobType, selectedJobCategory]);

  return (
    <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center font-semibold text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="mr-2" /> Volver a Reportes
      </button>
      <h2 className="mb-6 flex items-center text-3xl font-bold text-gray-800">
        <ClipboardList className="mr-3 text-blue-600" size={30} /> Desglose por Tipo de Trabajo en{' '}
        {selectedJobCategory}
      </h2>

      {Object.keys(aggregatedJobTypeData).length === 0 ? (
        <p className="py-10 text-center text-gray-600">
          No hay tipos de trabajo para esta categoría en el período seleccionado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead className="border-b border-gray-300 bg-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Tipo de Trabajo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Costo Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Monto Total Abonado
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(aggregatedJobTypeData).map(([jobType, data]) => (
                <tr key={jobType} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{jobType}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{data.totalUnits}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    ${data.totalCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    ${data.totalDeposited.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JobTypeDetailsView;
