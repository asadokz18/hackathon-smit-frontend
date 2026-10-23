import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Loading from './components/Loading';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import PatientDashboard from './pages/PatientDashboard';

const App = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set default tab on login/auth change based on role
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin':
          setActiveTab('analytics');
          break;
        case 'doctor':
          setActiveTab('overview');
          break;
        case 'receptionist':
          setActiveTab('patients');
          break;
        case 'patient':
          setActiveTab('my-profile');
          break;
        default:
          setActiveTab('');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loading message="Decrypting clinical workspace secure protocols..." />
      </div>
    );
  }

  // Unauthenticated Route Handler
  if (!user) {
    return showRegister ? (
      <Register onToggleLogin={() => setShowRegister(false)} />
    ) : (
      <Login onToggleRegister={() => setShowRegister(true)} />
    );
  }

  // Dynamic Dashboard Content Mapper based on user's authorized role
  const renderDashboardView = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard activeTab={activeTab} />;
      case 'doctor':
        return <DoctorDashboard activeTab={activeTab} />;
      case 'receptionist':
        return <ReceptionistDashboard activeTab={activeTab} />;
      case 'patient':
        return <PatientDashboard activeTab={activeTab} />;
      default:
        return (
          <div className="p-8 text-center">
            <h3 className="text-lg font-bold text-rose-500">Access Denied</h3>
            <p className="text-xs text-slate-400">Unauthorized role credentials.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      
      {/* 1. Responsive Sidebar (desktop sticky | mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. Main Content Board */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header with hamburger, notifications and upgrade tools */}
        <Header
          title={activeTab}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        {/* Operational Dashboard Panel */}
        <main className="flex-grow">
          {renderDashboardView()}
        </main>
      </div>

    </div>
  );
};

export default App;
