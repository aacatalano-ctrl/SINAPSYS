export const jobCategories = [
  { category: 'PRÓTESIS FIJA' },
  { category: 'DPR METAL ACRÍLICO' },
  { category: 'ACRÍLICO' },
  { category: 'FLEXIBLE' },
  { category: 'FLUJO DIGITAL' },
];

export const jobTypePrefixMap: { [key: string]: string } = {
  'PRÓTESIS FIJA': 'PTF',
  'DPR METAL ACRÍLICO': 'DMA',
  'ACRÍLICO': 'ACR',
  'FLEXIBLE': 'FLX',
  'FLUJO DIGITAL': 'FLD',
};

export const getJobTypeCategory = (fullJobType: string): string => {
  if (!fullJobType) return 'N/A';
  const parts = fullJobType.split(' - ');
  return parts[0] || fullJobType;
};
