import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { 
  Users, UserPlus, CreditCard, ShieldCheck, Trash2, ShieldAlert,
  CalendarCheck, HeartPulse, Activity, Zap, TrendingUp, Sparkles
} from 'lucide-react';

const AUTHORIZED_ADMIN_EMAIL = 'asadokz18@gmail.com';

const AdminDashboard = ({ activeTab }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [staff, setStaff] = useState([]);
  const [globalPatients, setGlobalPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Registration Form State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('doctor');
  const [staffSpecialization, setStaffSpecialization] = useState('');
  const [staffContact, setStaffContact] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Dashboard Datasets
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const resStats = await api.get('/api/analytics/admin');
      if (resStats.success) {
        setAnalytics(resStats.data);
      }
      
      const resStaff = await api.get('/api/users/staff');
      if (resStaff.success) {
        setStaff(resStaff.data);
      }

      const resPatients = await api.get('/api/patients');
      if (resPatients.success) {
        setGlobalPatients(resPatients.data);
      }
    } catch (err) {
      console.error('[Admin Fetch Error]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  // Handle Staff Creation
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!staffName || !staffEmail || !staffPassword) {
      setFormError('Please enter name, email, and password.');
      return;
    }

    try {
      const res = await api.post('/api/auth/register', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
        contact: staffContact,
        specialization: staffRole === 'doctor' ? staffSpecialization : '',
      });

      if (res.success) {
        setSuccessMsg(`Successfully registered ${staffName} as a ${staffRole.toUpperCase()}`);
        setShowAddStaffModal(false);
        // Reset
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffSpecialization('');
        setStaffContact('');
        fetchAdminData();
      }
    } catch (err) {
      setFormError(err.message || 'Registration failed.');
    }
  };

  // Handle Deactivating Staff Member
  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate and remove this staff member?')) return;
    try {
      const res = await api.delete(`/api/users/staff/${id}`);
      if (res.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  // Handle Upgrading/Downgrading SaaS plan
  const handleTogglePlan = async (id, currentPlan) => {
    const nextPlan = currentPlan === 'free' ? 'pro' : 'free';
    try {
      const res = await api.put(`/api/users/${id}/subscription`, { plan: nextPlan });
      if (res.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(`Plan modification failed: ${err.message}`);
    }
  };

  if (loading) return <Loading message="Syncing clinic analytics engine..." />;

  // Enforce administrative restriction check
  if (user && user.email !== AUTHORIZED_ADMIN_EMAIL) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-20 text-center space-y-6 fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-rose-500/5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Clinical Workspace Restricted</h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed font-sans">
            Administrative access is strictly restricted to the authorized clinical email address: <strong className="text-brand-400">{AUTHORIZED_ADMIN_EMAIL}</strong>.
          </p>
        </div>
      </div>
    );
  }

  if (!analytics) return <div className="p-8">Failed to compile admin variables.</div>;

  const { stats, diseaseChartData, appointmentTrends } = analytics;

  const COLORS = ['#0e8ce6', '#14b8a6', '#8b5cf6', '#f43f5e', '#f59e0b'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 fade-in">
      
      {/* 1. ANALYTICS WORKSPACE */}
      {activeTab === 'analytics' && (
        <>
          {/* Dashboard Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              title="Registered Patients"
              value={stats.totalPatients}
              icon={Users}
              description="Active digital patient files"
              trend={{ type: 'up', value: '+12% this week' }}
              color="brand"
            />
            <StatCard
              title="Active Staff (Doctors)"
              value={stats.totalDoctors}
              icon={HeartPulse}
              description="Specialized medical officers"
              color="clinical"
            />
            <StatCard
              title="Active Consultations"
              value={stats.totalAppointments}
              icon={CalendarCheck}
              description="Appointments logged in queue"
              color="violet"
            />
            <StatCard
              title="SaaS Simulated MRR"
              value={`PKR ${stats.monthlyRevenue}`}
              icon={CreditCard}
              description={`Active billing from ${stats.proSubscribers} clinics`}
              trend={{ type: 'up', value: '+PKR 196 Growth' }}
              color="emerald"
            />
          </div>

          {/* Recharts Graphical Board */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Appointment Queue Trend */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Appointments & Revenue Streams</h4>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-clinical-500/10 text-clinical-500 px-2 py-0.5 rounded border border-clinical-500/20">Monthly</span>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={appointmentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0e8ce6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0e8ce6" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15}/>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false}/>
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false}/>
                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}/>
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}/>
                    <Area type="monotone" name="Consultations" dataKey="appointments" stroke="#0e8ce6" strokeWidth={2} fillOpacity={1} fill="url(#colorAppt)" />
                    <Area type="monotone" name="Revenue ($)" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Disease Demographics Chart */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Top 5 Common Diagnoses (AI Tracked)</h4>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded border border-brand-500/20">Pathology Radar</span>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseaseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15}/>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false}/>
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false}/>
                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}/>
                    <Bar dataKey="value" name="Cases Logged" radius={[8, 8, 0, 0]}>
                      {diseaseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. CLINICAL STAFF PROVISIONING WORKSPACE */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Medical Staff Roster</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Add, view, or de-authorize clinic Doctors and Receptionists.</p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-brand-500/10 hover:shadow-brand-500/25 transition-all duration-150"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision Staff Account</span>
            </button>
          </div>

          {/* Roster Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {staff.map((member) => (
              <div key={member._id} className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500/5 to-clinical-500/0 rounded-bl-full pointer-events-none group-hover:scale-150 transition-all duration-500"></div>
                
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center font-bold text-lg text-brand-500 shrink-0 uppercase border border-slate-200 dark:border-slate-800">
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate text-slate-800 dark:text-white">{member.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full mt-2 inline-block ${
                      member.role === 'doctor' 
                        ? 'bg-clinical-500/10 text-clinical-600 dark:text-clinical-400 border border-clinical-500/20' 
                        : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex justify-between items-center relative z-10">
                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                    {member.role === 'doctor' ? (member.specialization || 'General Care') : member.contact || 'No phone'}
                  </span>
                  <button
                    onClick={() => handleDeleteStaff(member._id)}
                    className="p-2 rounded-xl border border-transparent hover:border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition-all"
                    title="Deactivate staff member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form Modal */}
          {showAddStaffModal && (
            <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
              <div className="glass-card p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Register Clinical Staff</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Provide credentials to authorize clinical activities.</p>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs flex gap-2 items-center">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Select Role</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                    >
                      <option value="doctor">Doctor (Medical Practitioner)</option>
                      <option value="receptionist">Receptionist (Clinic Operations)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Dr. Asad"
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="asad@clinic.com"
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Login Password</label>
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                    />
                  </div>

                  {staffRole === 'doctor' ? (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Specialization</label>
                      <input
                        type="text"
                        value={staffSpecialization}
                        onChange={(e) => setStaffSpecialization(e.target.value)}
                        placeholder="e.g. Neurologist"
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={staffContact}
                        onChange={(e) => setStaffContact(e.target.value)}
                        placeholder="0333-XXXXXXX"
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setShowAddStaffModal(false)}
                      className="flex-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all dark:text-slate-300 text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:shadow-lg shadow-brand-500/10 transition-all text-center"
                    >
                      Provision
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2.5 GLOBAL PATIENT REGISTRY */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Global Patient Registry</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Master access to all patient records, medical history, treatments, and instructions.</p>
            </div>
            <div className="text-xs bg-brand-500/10 text-brand-500 px-3 py-1.5 rounded-xl border border-brand-500/20 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{globalPatients.length} Patients Indexed</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {globalPatients.length === 0 ? (
              <div className="glass-card p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-400 min-h-[300px] flex flex-col justify-center items-center">
                <Users className="w-12 h-12 text-slate-350 dark:text-slate-700 mb-3" />
                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">No Patients Found</h4>
              </div>
            ) : (
              globalPatients.map((patient) => (
                <div key={patient._id} className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-500 to-clinical-400 flex items-center justify-center font-bold text-xl text-white shadow-inner uppercase">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white">{patient.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{patient.age} yrs • {patient.gender.toUpperCase()}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span>{patient.contact}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
                      Admin Master Access
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-brand-500" /> Chronic Medical History
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                          patient.medicalHistory.map((history, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20">
                              {history}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No chronic history logged.</span>
                        )}
                      </div>
                    </div>
                    <div>
                       <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                         <Activity className="w-4 h-4 text-clinical-500" /> Administrative Notice
                       </h5>
                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                         Full medical treatments, past prescriptions, and instructions for {patient.name} are available by pivoting to the respective appointment or prescription datasets in the admin logs or by simulating doctor access to their file.
                       </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. SAAS SUBSCRIPTION TIERS DESK */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">SaaS Billing Console</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Monitor active subscription matrix and configure account permissions.</p>
            </div>
            <div className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20 font-semibold flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulated Stripe Environment</span>
            </div>
          </div>

          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] font-extrabold font-sans">
                    <th className="px-6 py-4">Clinic Staff Member / Role</th>
                    <th className="px-6 py-4">SaaS Tier Plan</th>
                    <th className="px-6 py-4">Billing Status</th>
                    <th className="px-6 py-4 text-right">Subscription Control Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {staff.map((member) => (
                    <tr key={member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all text-slate-600 dark:text-slate-300">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-brand-500 font-bold flex items-center justify-center uppercase">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white block">{member.name}</span>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">{member.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.subscriptionPlan === 'pro' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
                            ★ PRO SAAS
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 font-bold text-[9px] uppercase tracking-wider inline-block">
                            FREE TIER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {member.subscriptionPlan === 'pro' ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active (PKR 13,720/mo)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Standby (PKR 0.00/mo)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleTogglePlan(member._id, member.subscriptionPlan)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border ${
                            member.subscriptionPlan === 'pro'
                              ? 'border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10'
                              : 'border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10'
                          }`}
                        >
                          {member.subscriptionPlan === 'pro' ? 'Downgrade' : 'Upgrade to Pro'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLINIC LOGS AUDIT DESK */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">System Core Diagnostics</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Monitor active thread queries, Google Gemini API endpoints, and database loads.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* API Status */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-clinical-500" /> API Gateway Tiers
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Gemini 1.5 Flash Model</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Operational
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">MongoDB Cluster Status</span>
                  <span className="text-emerald-500 font-bold">Operational</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">SMS Gateway Broker</span>
                  <span className="text-slate-400 font-semibold">Simulated Standby</span>
                </div>
              </div>
            </div>

            {/* AI Diagnostics run */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 animate-bounce" /> AI Analytics Volumes
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">AI Diagnosis Queries Logged</span>
                  <span className="text-slate-800 dark:text-white font-bold">{stats.totalAIQueries} runs</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Average Processing Speed</span>
                  <span className="text-clinical-500 font-bold">640 ms</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Gemini Response Success Rate</span>
                  <span className="text-emerald-500 font-bold">100.0%</span>
                </div>
              </div>
            </div>

            {/* SaaS Totals */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" /> SaaS Business Indicators
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Total Prescriptions Printed</span>
                  <span className="text-slate-800 dark:text-white font-bold">{stats.totalPrescriptions} documents</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Pro Subscription Ratio</span>
                  <span className="text-brand-500 font-bold">
                    {Math.round((stats.proSubscribers / (stats.totalDoctors + stats.totalReceptionists || 1)) * 100)}% active
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Simulated Stripe Invoices</span>
                  <span className="text-emerald-500 font-bold">Settled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Clinic Security Audit Stream</h4>
            <div className="bg-slate-950/80 p-4 rounded-xl font-mono text-[10px] text-slate-400 space-y-2 border border-slate-800 h-64 overflow-y-auto">
              <p className="text-slate-500">[2026-05-18 13:01:04] INFO: Initializing DB seeder. Created default Admin Сара Connor.</p>
              <p className="text-slate-500">[2026-05-18 13:01:05] INFO: Seeding default Cardiology Doctor Dr. Vance.</p>
              <p className="text-slate-500">[2026-05-18 13:01:05] INFO: Seeding Receptionist Clara Oswald.</p>
              <p className="text-slate-300">[2026-05-18 13:10:44] EVENT: JWT Token created successfully for doctor@medpulse.com. Expire 30d.</p>
              <p className="text-clinical-400">[2026-05-18 13:14:02] AI_GATE: Submitted symptom checker queries to Gemini-1.5-Flash for patient John Doe.</p>
              <p className="text-brand-400">[2026-05-18 13:14:03] AI_GATE: Successfully resolved Gemini API response. Completed in 548ms.</p>
              <p className="text-slate-300">[2026-05-18 13:15:20] DOC_GEN: Generated letterhead printable PDF for prescription ID: {stats.totalPrescriptions + 10}.</p>
              <p className="text-slate-500">[2026-05-18 13:30:11] HEARTBEAT: MongoDB connection status: Healthy. Port 27017 active.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
