// src/utils/helpers.js

// The jobCategories, jobTypePrefixMap, and jobTypeCosts constants have been centralized in the backend.
// The frontend will need to be updated to fetch this data from an API endpoint.

// Función para generar el código de caso único
export const generateCaseCode = (jobType: string, jobTypePrefixMap: { [key: string]: string }): string => {
  const category = jobType.split(' - ')[0].trim();
  const prefix = jobTypePrefixMap[category] || 'CAS';
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return `${prefix}-${uniqueId}`;
};

// Función para formatear fechas a un formato legible (solo fecha)
export const formatDate = (dateString: string): string => { // Add type for dateString
  if (!dateString) return 'N/A';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }; // Explicitly type options
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

// Función para formatear fechas a un formato legible (fecha y hora)
export const formatDateTime = (dateString: string): string => { // Add type for dateString
  if (!dateString) return 'N/A';
  const options: Intl.DateTimeFormatOptions = { // Explicitly type options
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // Para formato AM/PM
  };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

// Función para obtener solo la categoría principal del tipo de trabajo
export const getJobTypeCategory = (fullJobType: string): string => {
  if (!fullJobType) return 'N/A';
  const parts = fullJobType.split(' - ');
  return parts[0] || fullJobType;
};