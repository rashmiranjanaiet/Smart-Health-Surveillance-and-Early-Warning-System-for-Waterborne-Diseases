
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DiseaseBarChart, DiseasePieChart, AgeGroupChart, SourceTypeChart, WaterSourceChart } from '../components/Charts';
import { generateHealthReport, suggestPreventiveMeasures } from '../services/geminiService';
import { ArrowLeft, Sparkles, Activity, Thermometer, Droplets, AlertCircle, MapPin, BarChart3, Database, ChevronRight, Building2 } from 'lucide-react';
import { SubDivisionData } from '../types';
import { WaterQualityDashboard } from '../components/WaterQualityDashboard';
import { CampaignTicker } from '../components/CampaignTicker';

const StateDetails = () => {
  const { stateId } = useParams<{ stateId: string }>();
  const { statesData, waterQualityReports } = useApp();
  const state = statesData.find(s => s.id === stateId);

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [preventionTips, setPreventionTips] = useState<Record<string, string[]>>({});
  
  // Drill down state
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedSubDivision, setSelectedSubDivision] = useState<SubDivisionData | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  // Use district data if selected, otherwise use state aggregate data
  const selectedDistrict = state?.districts?.find(d => d.id === selectedDistrictId);
  const activeData = selectedDistrict || state;

  useEffect(() => {
    // Reset drill down if state changes
    setSelectedDistrictId(null);
    setSelectedSubDivision(null);
    setSelectedBlock(null);
  }, [stateId]);

  useEffect(() => {
      // Reset block when subdivision changes
      setSelectedBlock(null);
  }, [selectedSubDivision]);

  useEffect(() => {
    // Load prevention tips for top diseases
    if (activeData && activeData.diseases) {
        activeData.diseases.slice(0, 2).forEach(async (d) => {
             const tips = await suggestPreventiveMeasures(d.name);
             setPreventionTips(prev => ({...prev, [d.name]: tips}));
        });
    }
  }, [activeData]);

  // ---------------------------------------------------------------------------
  // DYNAMIC DATA AGGREGATION LOGIC
  // ---------------------------------------------------------------------------

  // 1. Compute displayed diseases based on hierarchy level (State -> District -> SubDiv -> Block)
  const displayedDiseases = useMemo(() => {
      if (!activeData || !activeData.diseases) return [];

      return activeData.diseases.map(disease => {
          // If drilling down into AR (or any state with structure), calculate from reports
          if (selectedSubDivision || selectedBlock) {
              const relevantReports = disease.reports?.filter(r => {
                  // Filter by SubDivision
                  if (selectedSubDivision && r.subDivision !== selectedSubDivision.name) return false;
                  // Filter by Block (if selected)
                  if (selectedBlock && r.block !== selectedBlock) return false;
                  return true;
              }) || [];

              const count = relevantReports.reduce((sum, r) => sum + r.casesCount, 0);
              // Return a virtual disease object for display purposes
              return { ...disease, affected: count };
          }
          
          // Default (District/State level) - use pre-calculated or aggregate
          return disease;
      });
  }, [activeData, selectedSubDivision, selectedBlock]);

  const totalActiveCases = displayedDiseases.reduce((sum, d) => sum + d.affected, 0);

  // 2. Collect detailed stats for the graphs (Age, Source, Water) based on the filtered view
  const detailedStats = useMemo(() => {
      // We must iterate over the displayedDiseases (which map 1:1 to activeData.diseases)
      // but we need to access the RAW reports from activeData to filter them again for these stats.
      
      if (!activeData || !activeData.diseases) return null;

      // Filter ALL reports across ALL diseases based on current view
      const allReports = activeData.diseases.flatMap(d => d.reports || []).filter(r => {
          if (selectedSubDivision && r.subDivision !== selectedSubDivision.name) return false;
          if (selectedBlock && r.block !== selectedBlock) return false;
          return true;
      });

      if (allReports.length === 0) return null;

      // Age Group Stats
      const ageStats = {
          under5: 0,
          fiveToFifteen: 0,
          over15: 0
      };
      
      // Source Type Stats
      const sourceStats: Record<string, number> = {};

      // Water Source Stats
      const waterStats: Record<string, number> = {};

      allReports.forEach(r => {
          // Age
          ageStats.under5 += r.ageGroups.under5;
          ageStats.fiveToFifteen += r.ageGroups.fiveToFifteen;
          ageStats.over15 += r.ageGroups.over15;

          // Source Type
          sourceStats[r.sourceType] = (sourceStats[r.sourceType] || 0) + 1;

          // Water Source
          if (r.waterSource) {
              waterStats[r.waterSource] = (waterStats[r.waterSource] || 0) + r.casesCount;
          }
      });

      return {
          ageData: [
              { name: '< 5 Years', value: ageStats.under5 },
              { name: '5 - 15 Years', value: ageStats.fiveToFifteen },
              { name: '> 15 Years', value: ageStats.over15 },
          ],
          sourceData: Object.entries(sourceStats).map(([name, value]) => ({ name, value })),
          waterData: Object.entries(waterStats).map(([name, value]) => ({ name, value })),
          totalReports: allReports.length
      };
  }, [activeData, selectedSubDivision, selectedBlock]);

  // 3. Filter Water Quality Reports based on current view
  const relevantWaterReports = useMemo(() => {
    return waterQualityReports.filter(r => {
      if (r.stateId !== state?.id) return false;
      if (selectedDistrictId && r.districtId !== selectedDistrictId) return false;
      if (selectedSubDivision && r.subDivision !== selectedSubDivision.name) return false;
      if (selectedBlock && r.block !== selectedBlock) return false;
      return true;
    });
  }, [waterQualityReports, state, selectedDistrictId, selectedSubDivision, selectedBlock]);

  const handleGenerateReport = async () => {
    if (!state) return;
    setLoadingAi(true);
    // Generate report based on currently visible data context
    const reportData = {
        ...state,
        name: selectedBlock ? `${selectedBlock} (${state.name})` : activeData.name,
        totalAffected: totalActiveCases,
        diseases: displayedDiseases
    };
    
    const report = await generateHealthReport(reportData);
    setAiReport(report);
    setLoadingAi(false);
  };

  if (!state || !activeData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-slate-800">State Not Found</h2>
        <Link to="/" className="text-teal-600 hover:underline mt-4">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* CAMPAIGN TICKER - Moving Text */}
      <CampaignTicker />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap">
         <Link to="/" className="hover:text-teal-600">Map</Link>
         <ChevronRight className="w-4 h-4" />
         <button 
            onClick={() => { setSelectedDistrictId(null); setSelectedSubDivision(null); }} 
            className={`hover:text-teal-600 ${!selectedDistrictId ? 'font-bold text-slate-800' : ''}`}
         >
             {state.name}
         </button>
         {selectedDistrictId && (
             <>
                <ChevronRight className="w-4 h-4" />
                <button 
                    onClick={() => { setSelectedSubDivision(null); setSelectedBlock(null); }}
                    className={`hover:text-teal-600 ${!selectedSubDivision ? 'font-bold text-slate-800' : ''}`}
                >
                    {selectedDistrict?.name}
                </button>
             </>
         )}
         {selectedSubDivision && (
             <>
                <ChevronRight className="w-4 h-4" />
                <button
                    onClick={() => setSelectedBlock(null)}
                    className={`hover:text-teal-600 ${!selectedBlock ? 'font-bold text-slate-800' : ''}`}
                >
                    {selectedSubDivision.name}
                </button>
             </>
         )}
         {selectedBlock && (
             <>
                <ChevronRight className="w-4 h-4" />
                <span className="font-bold text-slate-800">{selectedBlock}</span>
             </>
         )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                {selectedBlock || (selectedSubDivision ? selectedSubDivision.name : activeData.name)}
            </h1>
            <p className="text-slate-500 mt-1">
                {selectedBlock 
                    ? 'Block Level Analytics' 
                    : selectedSubDivision 
                        ? 'Subdivision Level Analytics' 
                        : selectedDistrictId 
                            ? 'District Level Dashboard' 
                            : 'State Level Dashboard'}
            </p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100">
            <Activity className="w-5 h-5" />
            <span className="font-bold">{totalActiveCases}</span>
            <span className="text-sm">Active Cases</span>
        </div>
      </div>

      {/* HIERARCHY NAVIGATION */}
      
      {/* 1. Select District (If none selected) */}
      {state.districts && !selectedDistrictId && (
          <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-600" /> Select District
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {state.districts.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDistrictId(d.id)}
                        className="p-3 rounded-lg border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all text-left group"
                      >
                          <p className="font-semibold text-slate-700 text-sm truncate group-hover:text-teal-700">{d.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{d.totalAffected} cases</p>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* 2. Select Subdivision (If District selected but no Subdivision) */}
      {selectedDistrict && selectedDistrict.subDivisions && !selectedSubDivision && (
          <div className="mb-8 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" /> Subdivisions in {selectedDistrict.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedDistrict.subDivisions.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSubDivision(sub)}
                        className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left"
                      >
                          <p className="font-bold text-indigo-900">{sub.name}</p>
                          <p className="text-xs text-indigo-500 mt-1">{sub.blocks.length} Blocks</p>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* 3. Select Blocks (If Subdivision selected) */}
      {selectedSubDivision && (
          <div className="mb-8 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" /> Blocks / Circles in {selectedSubDivision.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {selectedSubDivision.blocks.map((block, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedBlock(block.name)}
                        className={`p-3 rounded-lg border text-center transition-all
                            ${selectedBlock === block.name 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-offset-1 ring-purple-200' 
                                : 'bg-purple-50 border-purple-100 text-purple-900 hover:bg-purple-100 hover:border-purple-200'
                            }
                        `}
                      >
                          <p className="font-medium text-sm">{block.name}</p>
                      </button>
                  ))}
              </div>
          </div>
      )}


      {/* CHART SECTION - ALWAYS VISIBLE (Calculated Dynamically) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        {/* Left Column: Stats & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Disease Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayedDiseases.map(d => (
                <div key={d.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-slate-800">{d.name}</h3>
                        {d.trend === 'up' ? (
                             <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">Rising</span>
                        ) : d.trend === 'down' ? (
                             <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">Falling</span>
                        ) : (
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">Stable</span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{d.affected}</span>
                        <span className="text-sm text-slate-500">cases</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        {selectedBlock ? 'In Selected Block' : selectedSubDivision ? 'In Selected Subdivision' : 'District Total'}
                    </p>
                    
                    {/* Micro prevention tip */}
                    {preventionTips[d.name] && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Tip: {preventionTips[d.name][0]}
                            </p>
                        </div>
                    )}
                </div>
            ))}
          </div>

          {/* Charts Area */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex justify-between items-center">
                Visual Analysis
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    Scope: {selectedBlock || selectedSubDivision?.name || activeData.name}
                </span>
            </h3>
            {totalActiveCases > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-72">
                        <h4 className="text-center text-sm text-slate-500 mb-2">Distribution</h4>
                        <DiseasePieChart data={displayedDiseases} />
                    </div>
                    <div className="h-72">
                        <h4 className="text-center text-sm text-slate-500 mb-2">Case Count</h4>
                        <DiseaseBarChart data={displayedDiseases} />
                    </div>
                </div>
            ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                    <p>No active cases reported in this specific area.</p>
                </div>
            )}
          </div>
          
          {/* --- NEW FEATURE: WATER QUALITY DASHBOARD --- */}
          <WaterQualityDashboard reports={relevantWaterReports} />

          {/* Detailed Incident Analysis */}
          {detailedStats ? (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                          <Database className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-800">Detailed Incident Analysis</h3>
                          <p className="text-xs text-slate-500">Based on {detailedStats.totalReports} specific reports</p>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="h-64">
                          <h4 className="text-center text-xs font-bold text-slate-600 uppercase mb-2">Age Group Demographics</h4>
                          <AgeGroupChart data={detailedStats.ageData} />
                      </div>
                      <div className="h-64">
                          <h4 className="text-center text-xs font-bold text-slate-600 uppercase mb-2">Source of Report</h4>
                          <SourceTypeChart data={detailedStats.sourceData} />
                      </div>
                      <div className="h-64">
                          <h4 className="text-center text-xs font-bold text-slate-600 uppercase mb-2">Linked Water Sources</h4>
                          {detailedStats.waterData.length > 0 ? (
                             <WaterSourceChart data={detailedStats.waterData} />
                          ) : (
                              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                  No water source data available
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ) : (
              selectedSubDivision && (
                  <div className="bg-slate-50 p-8 text-center rounded-xl border border-slate-100 border-dashed text-slate-400">
                      Detailed incident analysis will appear here once data reports are filed for this location.
                  </div>
              )
          )}
        </div>

        {/* Right Column: AI Insights & Table */}
        <div className="space-y-8">
           {/* AI Insight Card */}
           <div className="bg-gradient-to-br from-teal-50 to-white p-6 rounded-xl border border-teal-100 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-teal-900">AI Health Report</h3>
             </div>
             
             {!aiReport ? (
                <div className="text-center py-6">
                    <p className="text-slate-600 mb-4 text-sm">
                        Generate an executive summary of current health trends for {selectedBlock || activeData.name} using Gemini AI.
                    </p>
                    <button 
                      onClick={handleGenerateReport}
                      disabled={loadingAi}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all w-full disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loadingAi ? (
                            <>Processing...</>
                        ) : (
                            <>Generate Insight</>
                        )}
                    </button>
                </div>
             ) : (
                 <div className="animate-fade-in">
                     <div className="prose prose-sm text-slate-700 mb-4">
                         {aiReport}
                     </div>
                     <button 
                        onClick={() => setAiReport(null)}
                        className="text-xs text-teal-600 hover:underline"
                     >
                        Refresh Analysis
                     </button>
                 </div>
             )}
           </div>

           {/* Data Table */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                   <h3 className="font-semibold text-slate-800">Detailed Records</h3>
               </div>
               <table className="w-full text-sm text-left">
                   <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                       <tr>
                           <th className="px-6 py-3">Disease</th>
                           <th className="px-6 py-3 text-right">Affected</th>
                           <th className="px-6 py-3 text-right">Trend</th>
                       </tr>
                   </thead>
                   <tbody>
                       {displayedDiseases.map(d => (
                           <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                               <td className="px-6 py-4 font-medium text-slate-900">{d.name}</td>
                               <td className="px-6 py-4 text-right">{d.affected}</td>
                               <td className="px-6 py-4 text-right">
                                   <span className={`px-2 py-1 rounded text-xs ${d.trend === 'up' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                       {d.trend}
                                   </span>
                               </td>
                           </tr>
                       ))}
                       {displayedDiseases.length === 0 && (
                           <tr>
                               <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                   No records found for this selection.
                               </td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StateDetails;
