import React from 'react';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { Order } from '../../types';

interface IncomeBreakdownViewProps {
  orders: Order[];
  onBack: () => void;
  jobTypePrefixMap: { [key: string]: string };
}

const IncomeBreakdownView: React.FC<IncomeBreakdownViewProps> = ({ orders, onBack, jobTypePrefixMap }) => {
  const incomeByJobType: { [key: string]: number } = {};

  orders.forEach(order => {
    const totalPaid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
    if (incomeByJobType[order.jobType]) {
      incomeByJobType[order.jobType] += totalPaid;
    } else {
      incomeByJobType[order.jobType] = totalPaid;
    }
  });

  const sortedJobTypes = Object.keys(incomeByJobType).sort((a, b) => incomeByJobType[b] - incomeByJobType[a]);

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl mb-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
      >
        <ArrowLeft className="mr-2" /> Volver a Reportes
      </button>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <DollarSign className="mr-3 text-green-600" size={30} /> Desglose de Ingresos por Tipo de Trabajo
      </h2>

      {sortedJobTypes.length === 0 ? (
        <p className="text-gray-600 text-center py-10">No hay ingresos registrados para el período seleccionado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Tipo de Trabajo</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Ingresos Totales</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobTypes.map(jobType => (
                <tr key={jobType} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800 font-medium">{jobType}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">${incomeByJobType[jobType].toFixed(2)}</td>
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