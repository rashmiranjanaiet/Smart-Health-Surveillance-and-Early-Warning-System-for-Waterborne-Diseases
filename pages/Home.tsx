
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { IndiaMap } from '../components/IndiaMap';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, AlertTriangle, Users, Video } from 'lucide-react';
import { DiseasePieChart, DiseaseBarChart } from '../components/Charts';

const Home = () => {
  const { statesData } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleStateClick = (stateId: string) => {
    navigate(`/state/${stateId}`);
  };

  const filteredStates = useMemo(() => {
    return statesData.filter(state => 
      state.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [statesData, searchTerm]);

  const nationalStats = useMemo(() => {
    const totalCases = statesData.reduce((acc, s) => acc + s.totalAffected, 0);
    const highRiskStates = statesData.filter(s => s.totalAffected > 500).length;
    
    // Aggregate disease totals
    const diseaseTotals: Record<string, number> = {};
    statesData.forEach(s => {
      s.diseases.forEach(d => {
        diseaseTotals[d.name] = (diseaseTotals[d.name] || 0) + d.affected;
      });
    });

    const topDisease = Object.entries(diseaseTotals).sort((a, b) => b[1] - a[1])[0];

    return { totalCases, highRiskStates, topDisease };
  }, [statesData]);

  // Data for aggregate charts
  const aggregateDiseaseData = useMemo(() => {
      const map = new Map<string, number>();
      statesData.forEach(s => {
          s.diseases.forEach(d => {
              map.set(d.name, (map.get(d.name) || 0) + d.affected);
          });
      });
      return Array.from(map.entries()).map(([name, affected]) => ({
          id: name, name, affected, trend: 'stable' as const, lastUpdated: ''
      }));
  }, [statesData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
             <Users className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm text-slate-500 font-medium">Total Active Cases</p>
             <p className="text-2xl font-bold text-slate-800">{nationalStats.totalCases.toLocaleString()}</p>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-3 bg-red-100 text-red-600 rounded-full">
             <AlertTriangle className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm text-slate-500 font-medium">High Risk States</p>
             <p className="text-2xl font-bold text-slate-800">{nationalStats.highRiskStates}</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-3 bg-teal-100 text-teal-600 rounded-full">
             <TrendingUp className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm text-slate-500 font-medium">Dominant Disease</p>
             <p className="text-2xl font-bold text-slate-800">
               {nationalStats.topDisease ? nationalStats.topDisease[0] : 'None'}
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Map */}
        <div className="lg:col-span-7 space-y-6">
          <IndiaMap data={statesData} onStateClick={handleStateClick} />
          
          {/* National Aggregates */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">National Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2 text-center">By Disease Type</h4>
                    <DiseasePieChart data={aggregateDiseaseData} />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2 text-center">Caseload Comparison</h4>
                    <DiseaseBarChart data={aggregateDiseaseData} />
                </div>
            </div>
          </div>

          {/* VIDEO SECTION: AUTOPLAY ENABLED */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Public Awareness Campaign</h3>
            </div>
            
            {/* Video Container */}
            <div className="w-full aspect-[16/9] bg-black rounded-lg overflow-hidden relative shadow-md group">
              {/* 
                  YouTube Parameters Explained:
                  autoplay=1  -> Auto start
                  mute=1      -> REQUIRED for autoplay in most browsers
                  loop=1      -> Loop the video
                  playlist=ID -> Required for looping a single video
                  controls=0  -> Hide player controls (cleaner look)
                  playsinline=1 -> Allow autoplay on mobile/iOS without fullscreen
                  rel=0       -> Don't show related videos from others
              */}
              <iframe 
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                src="https://www.youtube.com/embed/dT2Yg5V2AhY?autoplay=1&mute=1&loop=1&playlist=dT2Yg5V2AhY&controls=0&playsinline=1&rel=0&disablekb=1&modestbranding=1" 
                title="Health Awareness Video" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
              
              {/* Overlay to ensure clicks don't pause it easily (optional, removes interactivity) */}
              <div className="absolute inset-0 bg-transparent"></div>
            </div>
            <p className="text-sm text-slate-500 mt-3 text-center italic">
              Featured content: Disease prevention and hygiene awareness.
            </p>
          </div>

        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">State Data</h3>
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Search state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
              {filteredStates.map(state => (
                <div 
                  key={state.id}
                  onClick={() => handleStateClick(state.id)}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-teal-200 cursor-pointer transition-all group"
                >
                  <div>
                    <h4 className="font-semibold text-slate-700 group-hover:text-teal-700">{state.name}</h4>
                    <p className="text-xs text-slate-500">{state.diseases.length} monitored diseases</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{state.totalAffected}</p>
                    <p className="text-xs text-slate-500">cases</p>
                  </div>
                </div>
              ))}
              {filteredStates.length === 0 && (
                <p className="text-center text-slate-500 py-8">No states found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
