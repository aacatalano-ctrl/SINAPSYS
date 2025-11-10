import React from 'react';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { Order } from '../../types';

interface IncomeBreakdownViewProps {
  orders: Order[];
  onBack: () => void;
  jobTypePrefixMap: { [key: string]: string };
}

const IncomeBreakdownView: React.FC<IncomeBreakdownViewProps> = ({ orders, onBack }) => {
  const incomeByJobType: { [key: string]: number } = {};

  orders.forEach((order) => {
    const totalPaid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
    if (incomeByJobType[order.jobType]) {
      incomeByJobType[order.jobType] += totalPaid;
    } else {
      incomeByJobType[order.jobType] = totalPaid;
    }
  });

  const sortedJobTypes = Object.keys(incomeByJobType).sort(
    (a, b) => incomeByJobType[b] - incomeByJobType[a],
  );

  return (
    <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center font-semibold text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="mr-2" /> Volver a Reportes
      </button>
      <h2 className="mb-6 flex items-center text-3xl font-bold text-gray-800">
        <DollarSign className="mr-3 text-green-600" size={30} /> Desglose de Ingresos por Tipo de
        Trabajo
      </h2>

      {sortedJobTypes.length === 0 ? (
        <p className="py-10 text-center text-gray-600">
          No hay ingresos registrados para el período seleccionado.
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
                  Ingresos Totales
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedJobTypes.map((jobType) => (
                <tr key={jobType} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{jobType}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    ${incomeByJobType[jobType].toFixed(2)}
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

export default IncomeBreakdownView;
