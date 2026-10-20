import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { 
  User, CalendarDays, FileSpreadsheet, BrainCircuit, Sparkles, 
  CheckCircle, FileDown, Heart, ShieldCheck, HelpCircle, Activity 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

const PatientDashboard = ({ activeTab }) => {
  const { user, upgradePlan } = useAuth();
  const [patientProfile, setPatientProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Explainer state
  const [activeExplainId, setActiveExplainId] = useState('');
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [upgradeBlock, setUpgradeBlock] = useState(false);

  // Dynamic Language switcher in Urdu
  const [urduLanguage, setUrduLanguage] = useState(false);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const resPatients = await api.get('/api/patients');
      if (resPatients.success && resPatients.data.length > 0) {
        setPatientProfile(resPatients.data[0]); // gets their single linked patient file
      }

      const resAppts = await api.get('/api/appointments');
      if (resAppts.success) {
        setAppointments(resAppts.data);
      }

      const resPrescriptions = await api.get('/api/prescriptions');
      if (resPrescriptions.success) {
        setPrescriptions(resPrescriptions.data);
      }
    } catch (err) {
      console.error('[Patient Fetch Error]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [activeTab]);

  // Client-side PDF prescription drawer (matches clinic layout)
  const downloadPrescriptionPDF = (pr) => {
    const doc = new jsPDF();
    const pat = pr.patientId;
    const docObj = pr.doctorId;

    // Header Decoration
    doc.setFillColor(14, 140, 230); // brand
    doc.rect(0, 0, 210, 15, 'F');

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('MEDPULSE AI DIGITAL CLINIC', 20, 10);

    // Doctor Details
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Practitioner: ${docObj.name}`, 20, 28);
    doc.text(`Specialty: ${docObj.specialization || 'Cardiology & General Health'}`, 20, 34);
    doc.text(`Clinic Line: ${docObj.contact || '+92 333-4567890'}`, 20, 40);

    // Right Side Date
    const dateStr = new Date(pr.createdAt).toLocaleDateString();
    doc.text(`Date: ${dateStr}`, 150, 28);
    doc.text(`Rx ID: RX-${Math.floor(Math.random() * 90000) + 10000}`, 150, 34);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 46, 190, 46);

    // Patient Details
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('PATIENT PROFILE RECORD', 20, 54);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Name: ${pat.name}`, 20, 60);
    doc.text(`Age/Gender: ${pat.age} years / ${pat.gender.toUpperCase()}`, 20, 66);
    doc.text(`Contact: ${pat.contact}`, 120, 60);
    doc.text(`Medical History: ${pat.medicalHistory.join(', ') || 'None reported'}`, 120, 66);

    // Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 76, 170, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('MEDICATION FORMULA', 22, 81);
    doc.text('DOSAGE', 90, 81);
    doc.text('DURATION', 125, 81);
    doc.text('INSTRUCTIONS', 155, 81);

    // Table Rows
    doc.setFont('Helvetica', 'normal');
    let yPos = 90;
    pr.medicines.forEach((med, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPos - 4, 170, 6, 'F');
      }
      doc.text(med.name, 22, yPos);
      doc.text(med.dosage, 90, yPos);
      doc.text(med.duration, 125, yPos);
      doc.text(med.instructions, 155, yPos);
      yPos += 8;
    });

    // Notes Section
    doc.line(20, yPos + 2, 190, yPos + 2);
    doc.setFont('Helvetica', 'bold');
    doc.text('CLINICAL DIRECTIVES / LIFESTYLE ADVICE:', 20, yPos + 10);
    doc.setFont('Helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(pr.notes || 'Complete full course as specified. Stay hydrated.', 170);
    doc.text(splitNotes, 20, yPos + 16);

    // Footnote
    doc.setFillColor(14, 140, 230);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Generated via MedPulse AI Smart Diagnostics System. Digital clinic certificate authenticated.', 45, 292);

    doc.save(`Prescription_${pat.name.replace(' ', '_')}.pdf`);
  };

  // Trigger Google Gemini API explanation
  const handleRequestAiExplanation = async (prId) => {
    // SaaS Intercept check
    if (user.subscriptionPlan === 'free') {
      setUpgradeBlock(true);
      return;
    }

    setAiLoading(true);
    setAiExplanation(null);
    setActiveExplainId(prId);
    setUrduLanguage(false);

    try {
      const res = await api.post('/api/ai/explain', { prescriptionId: prId });
      if (res.success) {
        setAiExplanation(res.data);
      }
    } catch (err) {
      alert(`AI Explainer failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelfUpgrade = async () => {
    try {
      await upgradePlan('pro');
      setUpgradeBlock(false);
      confetti({ particleCount: 150, spread: 80 });
      alert('Upgraded successfully! Unlocked all premium AI explainers.');
    } catch (err) {
      alert('Upgrade failed');
    }
  };

  if (loading) return <Loading message="Syncing patient portal..." />;

  return (
    <div className="p-8 space-y-8 fade-in">
      
      {/* 1. MY MEDICAL PROFILE WORKSPACE */}
      {activeTab === 'my-profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          {patientProfile ? (
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500/10 to-clinical-500/0 rounded-bl-full pointer-events-none group-hover:scale-150 transition-all duration-500"></div>
                
                <div className="flex flex-col items-center text-center space-y-4 mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-clinical-400 flex items-center justify-center font-bold text-2xl text-white shadow-lg uppercase">
                    {patientProfile.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{patientProfile.name}</h3>
                    <span className="text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 inline-block mt-2">
                      Registered patient File
                    </span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-6 relative z-10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Age & Gender</span>
                    <span className="text-slate-800 dark:text-white font-bold">{patientProfile.age} yrs / {patientProfile.gender.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Registered Phone</span>
                    <span className="text-slate-800 dark:text-white font-bold">{patientProfile.contact}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Database Profile ID</span>
                    <span className="text-slate-500 font-semibold truncate max-w-[120px]">{patientProfile._id}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1 glass-card p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow text-center">
              <User className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider mb-2">No Profile Link</h4>
              <p className="text-xs text-slate-400">Please contact clinic receptionist to link patient file matching your account name: <strong>{user.name}</strong></p>
            </div>
          )}

          {/* Chronic Conditions & Intake History */}
          {patientProfile && (
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 md:p-8 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Clinical Intake Registry & Timeline</h3>
                  <p className="text-xs text-slate-400">Verify chronic diagnostic indicators and past clinical flags.</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Confirmed Pathology Conditions</h4>
                  <div className="flex flex-wrap gap-2">
                    {patientProfile.medicalHistory.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No chronic pathologies flagged on record.</span>
                    ) : (
                      patientProfile.medicalHistory.map((h, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> {h}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-4 h-4 text-brand-500" /> Diagnostic Intake Flow</h4>
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-xs text-slate-500 leading-relaxed font-semibold">
                    MedPulse System logs your symptoms, diagnostic prescriptions, and risk ratios to maintain a seamless, centralized electronic health record (EHR).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EHR Continuous Vitals Monitoring Station */}
          {patientProfile && (
            <div className="lg:col-span-3 glass-card p-6 md:p-8 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">EHR Continuous Vitals Monitoring</h3>
                  <p className="text-xs text-slate-400">Real-time telemetry feeds and clinical vitals history logs.</p>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">Live Feed Connected</span>
              </div>

              {/* Vitals Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Circulatory Pressure</span>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1">120/80 <span className="text-xs text-slate-400 font-normal">mmHg</span></h4>
                  </div>
                  <Activity className="w-8 h-8 text-brand-500" />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Heart Pulse Rate</span>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1">72 <span className="text-xs text-slate-400 font-normal">bpm</span></h4>
                  </div>
                  <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Thermoregulation</span>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1">98.6 <span className="text-xs text-slate-400 font-normal">°F</span></h4>
                  </div>
                  <Activity className="w-8 h-8 text-amber-500" />
                </div>
              </div>

              {/* Recharts Area Curve */}
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: '08:00 AM', systolic: 118, diastolic: 76, pulse: 68, temp: 98.2 },
                    { name: '12:00 PM', systolic: 122, diastolic: 81, pulse: 74, temp: 98.7 },
                    { name: '04:00 PM', systolic: 120, diastolic: 80, pulse: 72, temp: 98.6 },
                    { name: '08:00 PM', systolic: 124, diastolic: 82, pulse: 78, temp: 98.9 },
                  ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0e8ce6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0e8ce6" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1}/>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false}/>
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false}/>
                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '11px' }}/>
                    <Area type="monotone" name="Systolic BP" dataKey="systolic" stroke="#0e8ce6" strokeWidth={2} fillOpacity={1} fill="url(#colorBP)" />
                    <Area type="monotone" name="Pulse Rate" dataKey="pulse" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorPulse)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. CONSULTATIONS SCHEDULE WORKSPACE */}
      {activeTab === 'my-appointments' && (
        <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">My Clinical Consultations</h3>
            <p className="text-xs text-slate-400">Historical queue timelines and upcoming doctor appointments.</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No consultations scheduled under your name.
              </div>
            ) : (
              appointments.map((appt) => (
                <div key={appt._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 flex justify-between items-center gap-4 transition-all">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-800 dark:text-white">{appt.doctorId.name}</span>
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${
                        appt.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : appt.status === 'confirmed'
                          ? 'bg-brand-500/10 text-brand-600 border-brand-500/20'
                          : appt.status === 'cancelled'
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Specialization: <strong>{appt.doctorId.specialization || 'Cardiology & General Health'}</strong>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Date Target: {new Date(appt.date).toLocaleString()} | Reason: "{appt.reason}"
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. MY PRESCRIPTIONS & AI WORKSPACE */}
      {activeTab === 'my-prescriptions' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Prescriptions List */}
          <div className="xl:col-span-1 space-y-6">
            <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Active Prescriptions</h3>
                <p className="text-xs text-slate-400">Download letterheads or trigger Gemini AI explanations.</p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[500px] overflow-y-auto">
                {prescriptions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No prescriptions written for you.
                  </div>
                ) : (
                  prescriptions.map((pr) => {
                    const isActive = activeExplainId === pr._id;
                    return (
                      <div key={pr._id} className={`p-6 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 space-y-4 transition-all ${
                        isActive ? 'bg-gradient-to-r from-brand-500/5 to-clinical-500/0 border-l-4 border-brand-500' : ''
                      }`}>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{new Date(pr.createdAt).toLocaleDateString()}</span>
                          <span className="font-bold text-slate-800 dark:text-white block mt-0.5">Dr. Vance (Cardiology)</span>
                          <span className="text-[9px] uppercase font-bold text-brand-500 block mt-1">{pr.medicines.length} Medications in file</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadPrescriptionPDF(pr)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all dark:text-slate-350"
                          >
                            <FileDown className="w-3.5 h-3.5 text-brand-500" />
                            <span>Download PDF</span>
                          </button>
                          <button
                            onClick={() => handleRequestAiExplanation(pr._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-600 to-clinical-600 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow shadow-brand-500/10"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" />
                            <span>AI Explain</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* AI Explanations Display */}
          <div className="xl:col-span-2">
            
            {/* Loading */}
            {aiLoading && <Loading message="Generating layman explanation with Google Gemini AI..." />}

            {/* Explanation box */}
            {!aiLoading && aiExplanation && (
              <div className="glass-card p-6 md:p-8 bg-white dark:bg-slate-900/60 border border-clinical-500/20 shadow-md space-y-6 fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">AI Patient Counseling Desk</span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-500 animate-spin" />
                      Prescription Explanation Overview
                    </h3>
                  </div>

                  {/* Urdu Toggle Button */}
                  <button
                    onClick={() => setUrduLanguage(!urduLanguage)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-clinical-500/20 bg-clinical-500/10 text-clinical-600 dark:text-clinical-400 text-xs font-bold tracking-wide uppercase transition-all pulse-indicator hover:scale-105 active:scale-95"
                  >
                    <span>{urduLanguage ? 'English Explainer' : 'اردو میں سمجھیں (Urdu Option)'}</span>
                  </button>
                </div>

                {!urduLanguage ? (
                  /* English Layout */
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-brand-500" /> Layman Simple Explanation</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850/60 italic">
                        "{aiExplanation.simpleExplanation}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Lifestyle Directives</h4>
                        <ul className="space-y-2">
                          {aiExplanation.lifestyleRecommendations.map((r, i) => (
                            <li key={i} className="flex gap-2 items-start text-xs text-slate-500 dark:text-slate-400">
                              <CheckCircle className="w-3.5 h-3.5 text-clinical-500 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preventative Wellness Measures</h4>
                        <ul className="space-y-2">
                          {aiExplanation.preventiveAdvice.map((a, i) => (
                            <li key={i} className="flex gap-2 items-start text-xs text-slate-500 dark:text-slate-400">
                              <CheckCircle className="w-3.5 h-3.5 text-clinical-500 shrink-0 mt-0.5" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Beautiful Nastaliq Urdu Layout */
                  <div className="space-y-6 text-right" dir="rtl">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-end font-sans">
                        <HelpCircle className="w-4 h-4 text-brand-500" /> سادہ اردو وضاحت
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-loose bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850/60 font-sans shadow-inner">
                        {aiExplanation.urduExplanation.explanation}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">طرزِ زندگی کی ہدایات</h4>
                        <ul className="space-y-2">
                          {aiExplanation.urduExplanation.lifestyle.map((r, i) => (
                            <li key={i} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-350 justify-start">
                              <CheckCircle className="w-3.5 h-3.5 text-clinical-500 shrink-0 mt-1 ml-2" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">احتیاطی تدابیر اور ہدایات</h4>
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-loose font-sans">
                          {aiExplanation.urduExplanation.instructions}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!aiLoading && !aiExplanation && (
              <div className="glass-card p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-400 min-h-[300px] flex flex-col justify-center items-center">
                <BrainCircuit className="w-12 h-12 text-slate-350 dark:text-slate-700 mb-3 pulse-indicator" />
                <h4 className="text-sm font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2">Awaiting Pharmacy Ingestion</h4>
                <p className="text-xs text-slate-400 max-w-sm leading-normal">Choose one of the active prescriptions on the side, then click AI Explain to read Google Gemini Layman advice and bilingual Urdu instructions.</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SAAS PRO UPGRADE MODAL INTERCEPT */}
      {upgradeBlock && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card p-8 border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 max-w-sm text-center shadow-2xl space-y-6">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 p-3 rounded-full shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <div className="pt-4">
              <span className="text-[9px] uppercase font-extrabold tracking-widest bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded border border-amber-500/20">
                PRO PLAN EXCLUSIVE
              </span>
              <h3 className="text-lg font-bold text-white mt-4">Unlock AI Prescription explanations</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Layman explanations, lifestyle wellness tracking, and Nastaliq bilingual Urdu explanations are Pro capabilities.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px] text-left text-slate-400 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Google Gemini AI Layman explanation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Bilingual Urdu translations option</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Custom lifestyle and diet advice panels</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUpgradeBlock(false)}
                className="flex-1 border border-slate-800 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all"
              >
                Dismiss
              </button>
              <button
                onClick={handleSelfUpgrade}
                className="flex-1 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider hover:shadow-lg shadow-amber-500/20 transition-all"
              >
                Self-Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDashboard;
