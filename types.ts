
export interface DiseaseSymptoms {
  fever: boolean;
  diarrhea: number;
  vomiting: number;
  onsetDays: number;
}

export interface AgeGroupData {
  under5: number;
  fiveToFifteen: number;
  over15: number;
}

export interface DiseaseReport {
  id: string;
  sourceType: 'ASHA' | 'clinic' | 'volunteer';
  timestamp: string;
  symptoms: DiseaseSymptoms;
  casesCount: number;
  ageGroups: AgeGroupData;
  notes?: string;
  waterSource?: string;
  subDivision?: string;
  block?: string;
}

export interface DiseaseData {
  id: string;
  name: string;
  affected: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  reports?: DiseaseReport[];
}

export interface BlockData {
  name: string;
}

export interface SubDivisionData {
  name: string;
  blocks: BlockData[];
}

export interface DistrictData {
  id: string;
  name: string;
  diseases: DiseaseData[];
  totalAffected: number;
  subDivisions?: SubDivisionData[];
}

export interface StateData {
  id: string;
  name: string;
  diseases: DiseaseData[];
  totalAffected: number;
  adminEmail?: string; // Mock auth identifier
  districts?: DistrictData[]; // Optional for NE states drill-down
}

export interface User {
  isAuthenticated: boolean;
  stateId: string | null; // If admin, which state they manage
  role: 'admin' | 'guest';
}

export interface ChartDataPoint {
  name: string;
  value: number;
}