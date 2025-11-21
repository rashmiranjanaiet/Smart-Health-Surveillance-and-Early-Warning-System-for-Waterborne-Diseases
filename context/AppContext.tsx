
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StateData, User, DiseaseData, DistrictData, DiseaseReport } from '../types';
import { getAllStates } from '../constants';

interface AppContextType {
  statesData: StateData[];
  user: User;
  login: (stateName: string, password: string) => boolean;
  logout: () => void;
  updateDiseaseData: (stateId: string, disease: DiseaseData, districtId?: string) => void;
  addCustomDisease: (stateId: string, diseaseName: string, count: number, districtId?: string) => void;
  deleteDisease: (stateId: string, diseaseId: string, districtId?: string) => void;
  addDiseaseReport: (stateId: string, diseaseId: string, report: DiseaseReport, districtId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [statesData, setStatesData] = useState<StateData[]>([]);
  const [user, setUser] = useState<User>({ isAuthenticated: false, stateId: null, role: 'guest' });

  useEffect(() => {
    // Initialize mock database
    setStatesData(getAllStates());
  }, []);

  const login = (stateName: string, password: string) => {
    // Mock Login Logic
    // User: State Name (Case insensitive)
    // Pass: "admin"
    const targetState = statesData.find(s => s.name.toLowerCase() === stateName.toLowerCase());
    
    if (targetState && password === 'admin') {
      setUser({
        isAuthenticated: true,
        role: 'admin',
        stateId: targetState.id
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser({ isAuthenticated: false, stateId: null, role: 'guest' });
  };

  // Helper to re-aggregate state data from districts
  const recalculateStateFromDistricts = (state: StateData, updatedDistricts: DistrictData[]): StateData => {
    const aggDiseases: Record<string, { count: number; reports: DiseaseReport[] }> = {};
    
    updatedDistricts.forEach(d => {
      d.diseases.forEach(dis => {
        if (!aggDiseases[dis.name]) {
            aggDiseases[dis.name] = { count: 0, reports: [] };
        }
        aggDiseases[dis.name].count += dis.affected;
        if (dis.reports) {
            aggDiseases[dis.name].reports.push(...dis.reports);
        }
      });
    });

    // Preserve IDs/metadata from existing state diseases if possible, or create new view
    const newStateDiseases = Object.entries(aggDiseases).map(([name, data], idx) => {
      const existing = state.diseases.find(sd => sd.name === name);
      return {
        id: existing?.id || `agg-${idx}`,
        name,
        affected: data.count,
        trend: existing?.trend || 'stable',
        lastUpdated: new Date().toISOString().split('T')[0],
        reports: data.reports
      };
    });

    const newTotal = updatedDistricts.reduce((acc, d) => acc + d.totalAffected, 0);

    return {
      ...state,
      districts: updatedDistricts,
      diseases: newStateDiseases,
      totalAffected: newTotal
    };
  };

  const updateDiseaseData = (stateId: string, updatedDisease: DiseaseData, districtId?: string) => {
    setStatesData(prev => prev.map(state => {
      if (state.id !== stateId) return state;
      
      if (districtId && state.districts) {
        const updatedDistricts = state.districts.map(dist => {
          if (dist.id !== districtId) return dist;
          
          const newDiseases = dist.diseases.map(d => 
            d.id === updatedDisease.id ? updatedDisease : d
          );
          const newTotal = newDiseases.reduce((sum, d) => sum + d.affected, 0);
          
          return { ...dist, diseases: newDiseases, totalAffected: newTotal };
        });

        return recalculateStateFromDistricts(state, updatedDistricts);
      } else {
        const updatedDiseases = state.diseases.map(d => 
          d.id === updatedDisease.id ? updatedDisease : d
        );
        const total = updatedDiseases.reduce((sum, d) => sum + d.affected, 0);
        return { ...state, diseases: updatedDiseases, totalAffected: total };
      }
    }));
  };

  const addCustomDisease = (stateId: string, diseaseName: string, count: number, districtId?: string) => {
    setStatesData(prev => prev.map(state => {
      if (state.id !== stateId) return state;

      const newId = Math.random().toString(36).substr(2, 9);
      const newDisease: DiseaseData = {
        id: newId,
        name: diseaseName,
        affected: count,
        trend: 'stable',
        lastUpdated: new Date().toISOString().split('T')[0],
        reports: []
      };

      if (districtId && state.districts) {
        const updatedDistricts = state.districts.map(dist => {
          if (dist.id !== districtId) return dist;
          
          const newDiseases = [...dist.diseases, newDisease];
          const newTotal = newDiseases.reduce((sum, d) => sum + d.affected, 0);
          
          return { ...dist, diseases: newDiseases, totalAffected: newTotal };
        });

        return recalculateStateFromDistricts(state, updatedDistricts);
      } else {
        const newDiseases = [...state.diseases, newDisease];
        const total = newDiseases.reduce((sum, d) => sum + d.affected, 0);
        return { ...state, diseases: newDiseases, totalAffected: total };
      }
    }));
  };

  const deleteDisease = (stateId: string, diseaseId: string, districtId?: string) => {
    setStatesData(prev => prev.map(state => {
      if (state.id !== stateId) return state;

      if (districtId && state.districts) {
        const updatedDistricts = state.districts.map(dist => {
          if (dist.id !== districtId) return dist;
          
          const updatedDiseases = dist.diseases.filter(d => d.id !== diseaseId);
          const newTotal = updatedDiseases.reduce((sum, d) => sum + d.affected, 0);
          
          return { ...dist, diseases: updatedDiseases, totalAffected: newTotal };
        });

        return recalculateStateFromDistricts(state, updatedDistricts);
      } else {
        const updatedDiseases = state.diseases.filter(d => d.id !== diseaseId);
        const total = updatedDiseases.reduce((sum, d) => sum + d.affected, 0);
        return { ...state, diseases: updatedDiseases, totalAffected: total };
      }
    }));
  };

  const addDiseaseReport = (stateId: string, diseaseId: string, report: DiseaseReport, districtId?: string) => {
    setStatesData(prev => prev.map(state => {
      if (state.id !== stateId) return state;

      if (districtId && state.districts) {
        const updatedDistricts = state.districts.map(dist => {
          if (dist.id !== districtId) return dist;
          
          const updatedDiseases = dist.diseases.map(d => {
            if (d.id !== diseaseId) return d;
            return {
              ...d,
              affected: d.affected + report.casesCount,
              reports: [...(d.reports || []), report],
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          });
          const newTotal = updatedDiseases.reduce((sum, d) => sum + d.affected, 0);
          
          return { ...dist, diseases: updatedDiseases, totalAffected: newTotal };
        });

        return recalculateStateFromDistricts(state, updatedDistricts);
      } else {
        const updatedDiseases = state.diseases.map(d => {
            if (d.id !== diseaseId) return d;
            return {
              ...d,
              affected: d.affected + report.casesCount,
              reports: [...(d.reports || []), report],
              lastUpdated: new Date().toISOString().split('T')[0]
            };
        });
        const total = updatedDiseases.reduce((sum, d) => sum + d.affected, 0);
        return { ...state, diseases: updatedDiseases, totalAffected: total };
      }
    }));
  };

  return (
    <AppContext.Provider value={{ statesData, user, login, logout, updateDiseaseData, addCustomDisease, deleteDisease, addDiseaseReport }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
