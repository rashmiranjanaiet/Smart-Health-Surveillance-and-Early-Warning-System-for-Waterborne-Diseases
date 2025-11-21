import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Home from './pages/Home';
import StateDetails from './pages/StateDetails';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import { Activity, Shield, Map as MapIcon } from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useApp();
  const location = useLocation();

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-teal-400" />
            <Link to="/" className="font-bold text-xl tracking-tight">IndiaHealth Track</Link>
          </div>
          
          <div className="hidden md:flex space-x-4 items-center">
             <Link 
               to="/" 
               className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
             >
               Dashboard
             </Link>
             
             {user.isAuthenticated ? (
               <>
                <Link 
                  to="/admin/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('dashboard') ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  Admin Panel ({user.stateId})
                </Link>
                <button 
                  onClick={logout} 
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
               </>
             ) : (
               <Link 
                 to="/admin/login" 
                 className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
               >
                 <Shield className="h-4 w-4" />
                 State Admin Login
               </Link>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user } = useApp();
  if (!user.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/state/:stateId" element={<StateDetails />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
             <p>© {new Date().getFullYear()} IndiaHealth Track. Disease Monitoring System.</p>
          </footer>
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;
