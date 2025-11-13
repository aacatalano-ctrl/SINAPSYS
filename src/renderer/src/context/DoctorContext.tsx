import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Doctor } from '../../types';

const API_URL = '/api';

interface DoctorContextType {
  doctors: Doctor[];
  isDoctorsLoaded: boolean;
  editingDoctor: Doctor | null;
  setEditingDoctor: React.Dispatch<React.SetStateAction<Doctor | null>>;
  fetchDoctors: () => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
  updateDoctor: (id: string, fields: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<string | void>;
  exportDoctors: () => Promise<void>;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

interface DoctorProviderProps {
  children: ReactNode;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DoctorProvider: React.FC<DoctorProviderProps> = ({
  children,
  authFetch,
  showToast,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isDoctorsLoaded, setIsDoctorsLoaded] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setIsDoctorsLoaded(false);
    try {
      const response = await authFetch(`${API_URL}/doctors`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fetchedDoctors = await response.json();
      setDoctors(fetchedDoctors);
      setIsDoctorsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch doctors from web server:', error);
      setIsDoctorsLoaded(false);
    }
  }, [authFetch]);

  const addDoctor = useCallback(
    async (doctor: Omit<Doctor, 'id'>) => {
      try {
        const response = await authFetch(`${API_URL}/doctors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(doctor),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newDoctor = await response.json(); // Get the newly created doctor from the response
        setDoctors((prevDoctors) => [...prevDoctors, newDoctor]); // Immediately add to state
        return newDoctor; // Return the new doctor for potential use in CreateOrderView
      } catch (error) {
        console.error('Failed to add doctor:', error);
        showToast('Error al agregar el doctor. Por favor, intente de nuevo.', 'error');
        throw error; // Re-throw to allow error handling in components
      }
    },
    [authFetch, showToast],
  );

  const updateDoctor = useCallback(
    async (id: string, fields: Partial<Doctor>) => {
      try {
        const response = await authFetch(`${API_URL}/doctors/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fields),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const updatedDoctor = await response.json();
        setDoctors((prevDoctors) => prevDoctors.map((d) => (d._id === id ? updatedDoctor : d)));
        showToast('Doctor actualizado exitosamente.', 'success');
      } catch (error) {
        console.error('Failed to update doctor:', error);
        showToast('Error al actualizar el doctor. Por favor, intente de nuevo.', 'error');
      }
    },
    [authFetch, showToast],
  );

  const deleteDoctor = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          '¿Estás seguro de que quieres eliminar este doctor? Esta acción es irreversible y eliminará también las órdenes asociadas.',
        )
      ) {
        try {
          const response = await authFetch(`${API_URL}/doctors/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          setDoctors((prevDoctors) => prevDoctors.filter((d) => d._id !== id));
          showToast('Doctor eliminado exitosamente.', 'success');
          return id;
        } catch (error) {
          console.error('Failed to delete doctor:', error);
          showToast('Error al eliminar el doctor. Por favor, intente de nuevo.', 'error');
        }
      }
    },
    [authFetch, showToast],
  );

  const exportDoctors = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/export/doctors`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doctores-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export doctors:', error);
    }
  }, [authFetch]);

  const value = {
    doctors,
    isDoctorsLoaded,
    editingDoctor,
    setEditingDoctor,
    fetchDoctors,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    exportDoctors,
  };

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDoctors = (): DoctorContextType => {
  const context = useContext(DoctorContext);
  if (context === undefined) {
    throw new Error('useDoctors must be used within a DoctorProvider');
  }
  return context;
};
