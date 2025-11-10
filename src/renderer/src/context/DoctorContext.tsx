import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Doctor } from '../../types';
import { useUI } from './UIContext'; // Import useUI
import { useOrders } from './OrderContext'; // Import useOrders

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

  const { setIsLoading } = useUI(); // Get setIsLoading from UIContext
  const { fetchOrders } = useOrders(); // Get fetchOrders from OrderContext

  const withLoading = useCallback(async <T,>(asyncFunc: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true);
    try {
      return await asyncFunc();
    } catch (error) {
      console.error('An error occurred during a withLoading operation:', error);
      showToast('Ocurrió un error. Por favor, intente de nuevo.', 'error');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, showToast]);

  const fetchDoctors = useCallback(async () => {
    setIsDoctorsLoaded(false);
    try {
      const response = await authFetch(`${API_URL}/doctors`, { manualLoading: true }); // Use manualLoading
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
      return await withLoading(async () => {
        const response = await authFetch(`${API_URL}/doctors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(doctor),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newDoctor = await response.json();
        setDoctors((prevDoctors) => [...prevDoctors, newDoctor]);
        showToast('Doctor agregado exitosamente.', 'success');
        return newDoctor;
      });
    },
    [authFetch, showToast, withLoading],
  );

  const updateDoctor = useCallback(
    async (id: string, fields: Partial<Doctor>) => {
      await withLoading(async () => {
        const response = await authFetch(`${API_URL}/doctors/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fields),
          manualLoading: true, // Use manualLoading
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const updatedDoctor = await response.json();
        setDoctors((prevDoctors) => prevDoctors.map((d) => (d._id === id ? updatedDoctor : d)));
        showToast('Doctor actualizado exitosamente.', 'success');
        await fetchOrders(); // Refetch orders as doctor name might have changed
      });
    },
    [authFetch, showToast, withLoading, fetchOrders],
  );

  const deleteDoctor = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          '¿Estás seguro de que quieres eliminar este doctor? Esta acción es irreversible y eliminará también las órdenes asociadas.',
        )
      ) {
        await withLoading(async () => {
          const response = await authFetch(`${API_URL}/doctors/${id}`, {
            method: 'DELETE',
            manualLoading: true, // Use manualLoading
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          setDoctors((prevDoctors) => prevDoctors.filter((d) => d._id !== id));
          showToast('Doctor eliminado exitosamente.', 'success');
          await fetchOrders(); // Refetch orders after doctor deletion
        });
        return id;
      }
      return undefined;
    },
    [authFetch, showToast, withLoading, fetchOrders],
  );

  const exportDoctors = useCallback(async () => {
    await withLoading(async () => {
      const response = await authFetch(`${API_URL}/export/doctors`, { manualLoading: true }); // Use manualLoading
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
      showToast('Doctores exportados exitosamente.', 'success');
    });
  }, [authFetch, showToast, withLoading]);

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
