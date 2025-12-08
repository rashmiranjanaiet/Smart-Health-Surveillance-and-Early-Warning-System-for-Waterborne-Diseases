
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { LANGUAGES } from './utils/translations';
import Home from './pages/Home';
import StateDetails from './pages/StateDetails';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import QualityIndex from './pages/QualityIndex';
import WaterGuardGame from './pages/WaterGuardGame';
import GameSelection from './pages/GameSelection';
import { Activity, Shield, Wind, Gamepad2, Globe, ChevronDown } from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useApp();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Hide standard nav inside the game for immersion
  if (location.pathname === '/game' || location.pathname === '/game-selection') {
    return null;
  }

  const currentLangName = LANGUAGES.find(l => l.code === currentLanguage)?.name || 'English';

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-teal-400" />
            <Link to="/" className="font-bold text-xl tracking-tight">Jal Suraksha Kavach</Link>
          </div>
          
          <div className="hidden md:flex space-x-4 items-center">
             <Link 
               to="/" 
               className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
             >
               {t('Dashboard')}
             </Link>

             <Link 
               to="/quality-index" 
               className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/quality-index' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
             >
               <Wind className="w-4 h-4" />
               {t('Quality Index')}
             </Link>

             <Link 
               to="/game-selection" 
               className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-colors bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg transform hover:scale-105"
             >
               <Gamepad2 className="w-4 h-4" />
               {t('WaterGuard Hero')}
             </Link>
             
             {/* Language Switcher */}
             <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>{currentLangName}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-slate-200 animate-fade-in">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setIsLangOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${currentLanguage === lang.code ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          <span className="flex justify-between items-center">
                            <span>{lang.name}</span>
                            <span className="text-xs text-slate-400">{lang.nativeName}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
             </div>

             {user.isAuthenticated ? (
               <>
                <Link 
                  to="/admin/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('dashboard') ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  {t('Admin Panel')} ({user.stateId})
                </Link>
                <button 
                  onClick={logout} 
                  className="bg-red-500 hover:bg-red600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t('Logout')}
                </button>
               </>
             ) : (
               <Link 
                 to="/admin/login" 
                 className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
               >
                 <Shield className="h-4 w-4" />
                 {t('State Admin Login')}
               </Link>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useApp();
  if (!user.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <LanguageProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navigation />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quality-index" element={<QualityIndex />} />
                <Route path="/game" element={<WaterGuardGame />} />
                <Route path="/game-selection" element={<GameSelection />} />
                <Route path="/state/:stateId" element={<StateDetails />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <NavigationFooterWrapper />
          </div>
        </Router>
      </AppProvider>
    </LanguageProvider>
  );
};

// Helper to hide footer in game
const NavigationFooterWrapper = () => {
  const location = useLocation();
  if (location.pathname === '/game' || location.pathname === '/game-selection') return null;
  
  return (
    <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <p>© {new Date().getFullYear()} Jal Suraksha Kavach. Disease Monitoring System.</p>
    </footer>
  );
}

export default App;
