import React, { useState, useRef, useEffect } from 'react';
import { Order } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OrderSearchComboboxProps {
  orders: Order[];
  onSelectOrder: (order: Order | null) => void;
  getDoctorFullNameById: (id: string) => string;
  placeholder?: string;
}

const OrderSearchCombobox: React.FC<OrderSearchComboboxProps> = ({
  orders,
  onSelectOrder,
  getDoctorFullNameById,
  placeholder = 'Buscar orden por ID, paciente, doctor o tipo de trabajo...',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const filteredOrders = orders.filter((order) => {
    if (!order) return false; // Defend against null/undefined orders
    const searchTerm = inputValue.toLowerCase();
    const doctorName = getDoctorFullNameById(order.doctorId)?.toLowerCase() || '';

    return (
      (order._id || '').toLowerCase().includes(searchTerm) ||
      (order.patientName || '').toLowerCase().includes(searchTerm) ||
      doctorName.includes(searchTerm) ||
      (order.jobType || '').toLowerCase().includes(searchTerm)
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (e.target.value === '') {
      onSelectOrder(null); // Clear selection if input is cleared
    }
  };

  const handleSelect = (order: Order) => {
    setInputValue(`${order.patientName} (${getDoctorFullNameById(order.doctorId)}) - ${order.jobType}`);
    onSelectOrder(order);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredOrders.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredOrders.length) % filteredOrders.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex !== -1) {
        handleSelect(filteredOrders[highlightedIndex]);
      } else if (filteredOrders.length === 1) {
        handleSelect(filteredOrders[0]);
      }
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={comboboxRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      >
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen &&
        filteredOrders.length > 0 && ( // Only show dropdown if there are filtered results
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
            {filteredOrders.map((order, index) => (
              <li
                key={order._id}
                onClick={() => handleSelect(order)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`cursor-pointer px-4 py-2 hover:bg-blue-100 ${index === highlightedIndex ? 'bg-blue-100' : ''}`}
              >
                {`${order.patientName} (${getDoctorFullNameById(order.doctorId)}) - ${order.jobType}`}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
};

export default OrderSearchCombobox;
