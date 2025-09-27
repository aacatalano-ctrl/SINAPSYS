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

// This map is what the backend server.ts actually uses for generating order numbers
export const jobTypePrefixMap: { [key: string]: string } = {
  'PRÓTESIS FIJA': 'PTF',
  'DPR METAL ACRÍLICO': 'DMA',
  'ACRÍLICO': 'ACR',
  'FLEXIBLE': 'FLX',
  'FLUJO DIGITAL': 'FLD',
};

// This map can be used by other parts of the backend if needed, or exported via an API
export const jobTypeCosts: { [key: string]: number } = {};
jobCategories.forEach(category => {
  category.services.forEach(service => {
    const fullServiceName = `${category.category} - ${service.name}`;
    jobTypeCosts[fullServiceName] = service.price;
  });
});

export const getJobTypeCategory = (fullJobType: string): string => {
  if (!fullJobType) return 'N/A';
  const parts = fullJobType.split(' - ');
  return parts[0] || fullJobType;
};
