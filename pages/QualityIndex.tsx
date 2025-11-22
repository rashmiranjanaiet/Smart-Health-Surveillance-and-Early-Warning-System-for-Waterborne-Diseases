
import React, { useState } from 'react';
import { Droplets, CloudRain, Waves, Activity, Building2, Pipette, Bug, FileWarning, Stethoscope, MapPin, Calendar, Clock, Search, ArrowRight, Info, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { INDIAN_CITIES_MAP, NE_STATES } from '../constants';
import { getAdvancedReport } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend
} from 'recharts';

const REPORT_TYPES = [
  { id: 'water_quality', name: 'Water Quality Report', icon: Droplets, color: 'bg-blue-100 text-blue-600' },
  { id: 'bacterial_test', name: 'Bacterial Test Results', icon: Pipette, color: 'bg-purple-100 text-purple-600' },
  { id: 'turbidity_ph', name: 'Turbidity & pH Levels', icon: Waves, color: 'bg-teal-100 text-teal-600' },
  { id: 'rainfall_flood', name: 'Rainfall & Flood Alerts', icon: CloudRain, color: 'bg-sky-100 text-sky-600' },
  { id: 'groundwater', name: 'Groundwater Status', icon: ArrowRight, color: 'bg-amber-100 text-amber-600' }, 
  { id: 'disease_cases', name: 'Daily Disease Cases', icon: Activity, color: 'bg-red-100 text-red-600' },
  { id: 'hospital_opd', name: 'Hospital OPD Summary', icon: Stethoscope, color: 'bg-pink-100 text-pink-600' },
  { id: 'pipeline_leakage', name: 'Pipeline Leakage Reports', icon: FileWarning, color: 'bg-orange-100 text-orange-600' },
  { id: 'wastewater', name: 'Wastewater Overflow Alerts', icon: Waves, color: 'bg-stone-100 text-stone-600' },
  { id: 'mosquito', name: 'Mosquito Breeding Spots', icon: Bug, color: 'bg-green-100 text-green-600' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const QualityIndex = () => {
  // State for selected report type
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);

  // Form State
  const [form, setForm] = useState({
    state: '',
    city: '',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleSearch = async () => {
    if (!form.state || !form.city) {
      alert("Please select both State and City.");
      return;
    }

    setLoading(true);
    setData(null);

    const result = await getAdvancedReport(selectedReport.name, {
      state: form.state,
      city: form.city,
      date: form.date,
      time: form.time
    });

    setData(result);
    setLoading(false);
  };

  // Helper for Map URL
  const getMapUrl = () => {
    if (data && data.coordinates) {
       return `https://maps.google.com/maps?q=${data.coordinates.lat},${data.coordinates.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    }
    const query = form.city ? `${form.city}, ${form.state}` : 'North East India';
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
  };

  // Color helper for status
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('good') || s.includes('safe') || s.includes('low') || s.includes('excellent')) return 'text-green-600 bg-green-50 border-green-200';
    if (s.includes('moderate') || s.includes('satisfactory')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Prepare chart data safely
  const getChartData = () => {
    if (!data || !data.key_metrics) return [];
    return data.key_metrics.map((m: any) => ({
      name: m.name.length > 12 ? m.name.substring(0, 10) + '..' : m.name,
      full: m.name,
      value: parseFloat(m.value.toString().replace(/[^0-9.]/g, '')) || 0
    }));
  };

  const chartData = getChartData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-64px)]">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">North East India Environmental Tracker</h1>
        <p className="text-slate-500 mt-2">Comprehensive monitoring for 8 NE States (Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura)</p>
      </div>

      {/* 1. REPORT SELECTOR (Grid of Buttons) */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Select Report Type
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedReport.id === type.id;
                return (
                    <button
                        key={type.id}
                        onClick={() => { setSelectedReport(type); setData(null); }}
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center text-center gap-2 h-full
                            ${isSelected 
                                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200 shadow-md transform scale-105' 
                                : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                            }
                        `}
                    >
                        <div className={`p-2 rounded-full ${type.color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                            {type.name}
                        </span>
                    </button>
                );
            })}
        </div>
      </div>

      {/* 2. INPUT FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
             
             {/* State - Restricted to NE */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> State</label>
                <select 
                   value={form.state} 
                   onChange={(e) => setForm({ ...form, state: e.target.value, city: '' })}
                   className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="">Select State</option>
                    {NE_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
             </div>

             {/* City */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">City / District</label>
                <select 
                   value={form.city} 
                   onChange={(e) => setForm({...form, city: e.target.value})}
                   className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                   disabled={!form.state}
                >
                    <option value="">Select City</option>
                    {form.state && INDIAN_CITIES_MAP[form.state]?.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
             </div>

             {/* Date */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</label>
                <input 
                   type="date"
                   value={form.date}
                   onChange={(e) => setForm({...form, date: e.target.value})}
                   className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>

             {/* Time */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Time (Opt)</label>
                <input 
                   type="time"
                   value={form.time}
                   onChange={(e) => setForm({...form, time: e.target.value})}
                   className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>

             {/* Analyze Button */}
             <button 
               onClick={handleSearch}
               disabled={loading}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed h-[42px]"
             >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                       <Search className="w-4 h-4" /> Analyze
                    </>
                )}
             </button>
          </div>
      </div>

      {/* 3. SPLIT VIEW: DATA (LEFT) - MAP (RIGHT) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
          
          {/* LEFT SIDE: DATA DISPLAY */}
          <div className="space-y-6">
              {!data && !loading && (
                  <div className="h-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8">
                      <Info className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-bold text-slate-500">No Data Generated</h3>
                      <p className="text-slate-400 text-sm mt-2">Select a report type and location above to generate an AI analysis.</p>
                  </div>
              )}

              {loading && (
                  <div className="h-full bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4 animate-pulse">
                      <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-64 bg-slate-200 rounded-xl w-full mt-6"></div>
                  </div>
              )}

              {data && !loading && (
                  <div className="animate-fade-in space-y-6">
                      
                      {/* Title Card */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                          {/* Simulation Badge for Free Tier */}
                          {data.is_simulated && (
                             <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-bl-lg border-b border-l border-amber-200 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Simulated Data (Free Tier Limit)
                             </div>
                          )}
                          {!data.is_simulated && (
                             <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-bl-lg border-b border-l border-green-200 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Live AI Analysis
                             </div>
                          )}

                          <div className="flex justify-between items-start mt-2">
                              <div>
                                  <h2 className="text-2xl font-bold text-slate-900">{data.title}</h2>
                                  <p className="text-sm text-slate-500 mt-1">{selectedReport.name} • {form.city}, {form.state}</p>
                              </div>
                              <div className={`px-4 py-2 rounded-lg text-sm font-bold border ${getStatusColor(data.overall_status)}`}>
                                  {data.overall_status}
                              </div>
                          </div>
                          <p className="mt-4 text-slate-700 leading-relaxed">{data.summary}</p>
                      </div>

                      {/* Metrics Visualizations */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                              <Activity className="w-4 h-4" /> Key Metrics Visualization
                          </h3>
                          
                          {/* 1. Text Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                              {data.key_metrics?.map((metric: any, idx: number) => (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                                      <p className="text-xs font-bold text-slate-500 uppercase truncate" title={metric.name}>{metric.name}</p>
                                      <div className="flex items-baseline gap-1 mt-1">
                                          <span className="text-lg font-bold text-slate-900">{metric.value}</span>
                                          <span className="text-xs text-slate-400">{metric.unit}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          {/* 2. Charts Grid */}
                          <div className="grid grid-cols-1 gap-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  
                                  {/* Bar Chart */}
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 text-center">Comparative Values (Bar)</h4>
                                      <div className="h-48 w-full">
                                          <ResponsiveContainer width="100%" height="100%">
                                              <BarChart data={chartData}>
                                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                                                  <YAxis tick={{fontSize: 10}} />
                                                  <Tooltip />
                                                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                      {chartData.map((entry: any, index: number) => (
                                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                      ))}
                                                  </Bar>
                                              </BarChart>
                                          </ResponsiveContainer>
                                      </div>
                                  </div>

                                  {/* Pie Chart */}
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 text-center">Metric Distribution (Pie)</h4>
                                      <div className="h-48 w-full">
                                          <ResponsiveContainer width="100%" height="100%">
                                              <PieChart>
                                                  <Pie
                                                      data={chartData}
                                                      cx="50%"
                                                      cy="50%"
                                                      innerRadius={40}
                                                      outerRadius={60}
                                                      paddingAngle={5}
                                                      dataKey="value"
                                                  >
                                                      {chartData.map((entry: any, index: number) => (
                                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                      ))}
                                                  </Pie>
                                                  <Tooltip />
                                                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}} />
                                              </PieChart>
                                          </ResponsiveContainer>
                                      </div>
                                  </div>
                              </div>

                              {/* Line Chart */}
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 text-center">Trend Analysis (Line)</h4>
                                  <div className="h-48 w-full">
                                      <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={chartData}>
                                              <CartesianGrid strokeDasharray="3 3" />
                                              <XAxis dataKey="name" tick={{fontSize: 10}} />
                                              <YAxis tick={{fontSize: 10}} />
                                              <Tooltip />
                                              <Legend />
                                              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                                          </LineChart>
                                      </ResponsiveContainer>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Alerts & Recommendations */}
                      <div className="grid grid-cols-1 gap-4">
                          {data.alerts && data.alerts.length > 0 && (
                              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                  <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4" /> Critical Alerts
                                  </h4>
                                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                      {data.alerts.map((alert: string, i: number) => (
                                          <li key={i}>{alert}</li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                          
                          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                              <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                  <Info className="w-4 h-4" /> Recommendations
                              </h4>
                              <ul className="list-disc list-inside text-sm text-indigo-700 space-y-1">
                                  {data.recommendations?.map((rec: string, i: number) => (
                                      <li key={i}>{rec}</li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* RIGHT SIDE: MAP DISPLAY */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[500px] lg:h-auto sticky top-24">
             <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> 
                    Location View
                 </h3>
                 {data && data.coordinates && (
                     <span className="text-xs text-slate-400 font-mono">
                        {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}
                     </span>
                 )}
             </div>
             <div className="flex-1 relative bg-slate-100">
                 <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={getMapUrl()}
                    className="absolute inset-0 w-full h-full"
                 ></iframe>
                 
                 {/* Overlay Legend if needed */}
                 <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded shadow text-xs text-slate-500 border border-slate-200">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> High Risk</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Safe Zone</div>
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default QualityIndex;
