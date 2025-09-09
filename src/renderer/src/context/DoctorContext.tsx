import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Doctor } from '../../types';

// Define the shape of the context
interface DoctorContextType {
  doctors: Doctor[];
  editingDoctor: Doctor | null;
  setEditingDoctor: React.Dispatch<React.SetStateAction<Doctor | null>>;
  fetchDoctors: () => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
  updateDoctor: (id: string, fields: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  exportDoctors: () => Promise<void>;
}

// Create the context
const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

// Create a provider component
interface DoctorProviderProps {
  children: ReactNode;
}

export const DoctorProvider: React.FC<DoctorProviderProps> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/doctors');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fetchedDoctors = await response.json();
      setDoctors(fetchedDoctors);
    } catch (error) {
      console.error('Failed to fetch doctors from web server:', error);
    }
  }, []);

  const addDoctor = useCallback(async (doctor: Omit<Doctor, 'id'>) => {
    try {
      const response = await fetch('http://localhost:3001/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doctor),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchDoctors(); // Refresh list
    } catch (error) {
      console.error('Failed to add doctor:', error);
    }
  }, [fetchDoctors]);

  const updateDoctor = useCallback(async (id: string, fields: Partial<Doctor>) => {
    try {
      const response = await fetch(`http://localhost:3001/api/doctors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchDoctors(); // Refresh list
    } catch (error) {
      console.error('Failed to update doctor:', error);
    }
  }, [fetchDoctors]);

  const deleteDoctor = useCallback(async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/doctors/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchDoctors(); // Refresh list
    } catch (error) {
      console.error('Failed to delete doctor:', error);
    }
  }, [fetchDoctors]);

  const exportDoctors = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/export/doctors');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doctores-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export doctors:', error);
    }
  }, []);

  const value = {
    doctors,
    editingDoctor,
    setEditingDoctor,
    fetchDoctors,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    exportDoctors,
  };

  return (
    <DoctorContext.Provider value={value}>
      {children}
    </DoctorContext.Provider>
  );
};

// Create a custom hook to use the context
export const useDoctors = (): DoctorContextType => {
  const context = useContext(DoctorContext);
  if (context === undefined) {
    throw new Error('useDoctors must be used within a DoctorProvider');
  }
  return context;
};