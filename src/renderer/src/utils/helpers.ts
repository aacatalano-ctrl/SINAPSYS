// src/utils/helpers.js

export const jobCategories = [
  {
    category: 'PRÓTESIS FIJA',
    services: [
      { name: 'Cerámica Gingival', price: 30 },
      { name: 'Corona Total Cerámica (DISILICATO)', price: 120 },
      { name: 'Corona Metal Cerámica', price: 110 },
      { name: 'Corona de Zirconio', price: 130 },
      { name: 'Corona de Zirconio 4D', price: 140 },
      { name: 'Encerado Diagnóstico 3D', price: 10 },
      { name: 'Fresado de Implante', price: 30 },
      { name: 'Implante con Disilicato', price: 130 },
      { name: 'Implante con Metal Cerámica', price: 120 },
      { name: 'Implante con Zirconio', price: 140 },
      { name: 'Implante con Zirconio 4D', price: 170 },
      { name: 'Muñón Artificial', price: 30 },
      { name: 'Provisionales Termocurado', price: 30 },
      { name: 'Provisional PMMA', price: 40 },
      { name: 'Provisional PMMA sobre Implante', price: 50 },
      { name: 'Barra Metálica para Híbridas', price: 120 },
    ],
  },
  {
    category: 'DPR METAL ACRÍLICO',
    services: [
      { name: 'DPR de 1 a 3 Unidades', price: 120 },
      { name: 'DPR de 4 a 7 Unidades', price: 130 },
      { name: 'DPR de 8 a 10 Unidades', price: 140 },
      { name: 'Respaldo Metálico', price: 20 },
    ],
  },
  {
    category: 'ACRÍLICO',
    services: [
      { name: 'Acrílico Inyectado de 1 a 3 Unidades', price: 100 },
      { name: 'Acrílico Inyectado de 4 a 7 Unidades', price: 110 },
      { name: 'Acrílico Inyectado de 8 a 12', price: 120 },
      { name: 'Gancho Colado', price: 20 },
      { name: 'Gancho Contorneado', price: 15 },
      { name: 'Parcial Acrílico de 1 a 3 Unidades', price: 90 },
      { name: 'Parcial Acrílico de 4 a 7 Unidades', price: 95 },
      { name: 'Parcial Acrílico de 8 a 10 Unidades', price: 100 },
      { name: 'Prótesis Totales', price: 130 },
      { name: 'Rebase Acrílico', price: 35 },
      { name: 'Rejilla Fundida', price: 70 },
      { name: 'Rejilla Prefabricada', price: 30 },
    ],
  },
  {
    category: 'FLEXIBLE',
    services: [
      { name: 'De 1 a 6 Unidades', price: 95 },
      { name: 'De 7 a 12 Unidades', price: 110 },
      { name: 'De 1 a 3 Unidades Unilateral', price: 90 },
    ],
  },
  {
    category: 'FLUJO DIGITAL',
    services: [
      { name: 'Corona Impresa', price: 5 },
      { name: 'Diseño Digital por Unidad', price: 10 },
      { name: 'Escaneo de Modelo', price: 15 },
      { name: 'Modelo Impreso 3D', price: 20 },
    ],
  },
];

// Generate jobTypePrefixMap and jobTypeCosts from jobCategories
export const jobTypePrefixMap: { [key: string]: string } = {}; // Add index signature
export const jobTypeCosts: { [key: string]: number } = {}; // Add index signature

jobCategories.forEach(category => {
  category.services.forEach(service => {
    const fullServiceName = `${category.category} - ${service.name}`;
    jobTypeCosts[fullServiceName] = service.price;

    const categoryPrefix = category.category.replace(/[^A-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const servicePrefix = service.name.replace(/[^A-Z0-9]/g, '').substring(0, 3).toUpperCase();
    jobTypePrefixMap[fullServiceName] = `${categoryPrefix}-${servicePrefix}`;
  });
});

// Función para generar el código de caso único
export const generateCaseCode = (jobType: string): string => { // Add type for jobType
  const prefix = jobTypePrefixMap[jobType] || 'CAS';
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