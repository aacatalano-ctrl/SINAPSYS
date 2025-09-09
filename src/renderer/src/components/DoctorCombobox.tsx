import React, { useState, useRef, useEffect } from 'react';
import { Doctor } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DoctorComboboxProps {
  doctors: Doctor[];
  selectedDoctorId: string;
  onSelectDoctor: (id: string) => void;
  placeholder?: string;
}

const DoctorCombobox: React.FC<DoctorComboboxProps> = ({
  doctors, selectedDoctorId, onSelectDoctor, placeholder = "Selecciona o busca un doctor..."
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const comboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = doctors.find(doc => doc.id === selectedDoctorId);
    if (selected) {
      setInputValue(`${selected.title} ${selected.firstName} ${selected.lastName}`);
    } else {
      setInputValue('');
    }
  }, [selectedDoctorId, doctors]);

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.title} ${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (doctor: Doctor) => {
    setInputValue(`${doctor.title} ${doctor.firstName} ${doctor.lastName}`);
    onSelectDoctor(doctor.id);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filteredDoctors.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filteredDoctors.length) % filteredDoctors.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex !== -1) {
        handleSelect(filteredDoctors[highlightedIndex]);
      } else if (filteredDoctors.length === 1) {
        handleSelect(filteredDoctors[0]);
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
        className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      >
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && filteredDoctors.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
          {filteredDoctors.map((doctor, index) => (
            <li
              key={doctor.id}
              onClick={() => handleSelect(doctor)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${index === highlightedIndex ? 'bg-blue-100' : ''}`}
            >
              {`${doctor.title} ${doctor.firstName} ${doctor.lastName}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DoctorCombobox;