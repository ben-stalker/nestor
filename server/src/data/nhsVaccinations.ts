export interface NhsVaccination {
  id: string;
  name: string;
  age_weeks: number;
  description: string;
}

const nhsVaccinations: NhsVaccination[] = [
  {
    id: 'v8w',
    name: '6-in-1 (dose 1)',
    age_weeks: 8,
    description: 'Diphtheria, tetanus, whooping cough, polio, Hib, hep B',
  },
  { id: 'pcv1', name: 'Pneumococcal (dose 1)', age_weeks: 8, description: 'Pneumococcal disease' },
  { id: 'rv1', name: 'Rotavirus (dose 1)', age_weeks: 8, description: 'Rotavirus gastroenteritis' },
  { id: 'men1', name: 'MenB (dose 1)', age_weeks: 8, description: 'Meningococcal B' },
  {
    id: 'v12w',
    name: '6-in-1 (dose 2)',
    age_weeks: 12,
    description: 'Diphtheria, tetanus, whooping cough, polio, Hib, hep B',
  },
  {
    id: 'rv2',
    name: 'Rotavirus (dose 2)',
    age_weeks: 12,
    description: 'Rotavirus gastroenteritis',
  },
  {
    id: 'v16w',
    name: '6-in-1 (dose 3)',
    age_weeks: 16,
    description: 'Diphtheria, tetanus, whooping cough, polio, Hib, hep B',
  },
  { id: 'pcv2', name: 'Pneumococcal (dose 2)', age_weeks: 16, description: 'Pneumococcal disease' },
  { id: 'men2', name: 'MenB (dose 2)', age_weeks: 16, description: 'Meningococcal B' },
  {
    id: 'hib1',
    name: 'Hib/MenC',
    age_weeks: 52,
    description: 'Haemophilus influenzae type b / Meningococcal C',
  },
  { id: 'mmr1', name: 'MMR (dose 1)', age_weeks: 52, description: 'Measles, mumps and rubella' },
  { id: 'pcv3', name: 'Pneumococcal (dose 3)', age_weeks: 52, description: 'Pneumococcal disease' },
  { id: 'men3', name: 'MenB (dose 3)', age_weeks: 52, description: 'Meningococcal B' },
  {
    id: 'mmr2',
    name: 'MMR (dose 2)',
    age_weeks: 156,
    description: 'Measles, mumps and rubella booster (3 years 4 months)',
  },
  {
    id: 'dtap',
    name: '4-in-1 pre-school booster',
    age_weeks: 156,
    description: 'Diphtheria, tetanus, whooping cough, polio',
  },
  {
    id: 'men4',
    name: 'MenACWY',
    age_weeks: 676,
    description: 'Meningococcal ACWY (around age 13)',
  },
  {
    id: 'tdip',
    name: '3-in-1 teenage booster',
    age_weeks: 676,
    description: 'Tetanus, diphtheria and polio',
  },
];

export default nhsVaccinations;
