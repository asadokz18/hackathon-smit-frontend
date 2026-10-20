import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  CalendarDays, FileSpreadsheet, BrainCircuit, UserCog, CheckCircle, 
  Trash2, Plus, Sparkles, ChevronRight, Activity, AlertTriangle, FileDown, ShieldAlert
} from 'lucide-react';
import jsPDF from 'jspdf';

const DoctorDashboard = ({ activeTab }) => {
  const { user, upgradePlan } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Consult State (for prescription builder)
  const [activeConsult, setActiveConsult] = useState(null);
  const [medicineLines, setMedicineLines] = useState([{ name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After meals' }]);
  const [consultNotes, setConsultNotes] = useState('');

  // AI Checker States
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [aiDiagnostic, setAiDiagnostic] = useState(null);
  const [aiRisk, setAiRisk] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [upgradeBlock, setUpgradeBlock] = useState(false);

  const COMMON_MEDS = [
    'Amoxicillin',
    'Penicillin V',
    'Bactrim (Sulfamethoxazole)',
    'Lisinopril',
    'Metformin',
    'Atorvastatin',
    'Omeprazole',
    'Amlodipine',
    'Albuterol Inhaler',
    'Ibuprofen',
    'Panadol (Paracetamol)',
    'Augmentin',
    'Sulfasalazine',
    'Ciprofloxacin'
  ];

  const getActiveAllergyWarnings = () => {
    if (!activeConsult || !activeConsult.patientId || !activeConsult.patientId.medicalHistory) return [];
    const patientHistory = activeConsult.patientId.medicalHistory.map(h => h.toLowerCase());
    const warnings = [];

    medicineLines.forEach((med, idx) => {
      const medName = med.name.toLowerCase();
      if (!medName) return;

      // 1. Penicillin check
      if ((medName.includes('penicillin') || medName.includes('amoxicillin') || medName.includes('augmentin')) &&
          patientHistory.some(h => h.includes('penicillin') || h.includes('allergy') || h.includes('dust'))) {
        warnings.push(`Medication Allergy Flag: "${med.name}" in Row ${idx + 1} conflicts with Patient's drug allergy triggers!`);
      }

      // 2. Sulfa drug check
      if ((medName.includes('bactrim') || medName.includes('sulfa') || medName.includes('sulfasalazine')) &&
          patientHistory.some(h => h.includes('sulfa') || h.includes('sulfonamide'))) {
        warnings.push(`Medication Allergy Flag: "${med.name}" in Row ${idx + 1} contains sulfonamides which conflicts with Patient's Sulfa Allergy history!`);
      }
    });

    return warnings;
  };

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const resStats = await api.get('/api/analytics/doctor');
      if (resStats.success) {
        setStats(resStats.data);
      }

      const resAppts = await api.get('/api/appointments');
      if (resAppts.success) {
        setAppointments(resAppts.data);
      }

      const resPatients = await api.get('/api/patients');
      if (resPatients.success) {
        setPatients(resPatients.data);
      }

      const resPrescriptions = await api.get('/api/prescriptions');
      if (resPrescriptions.success) {
        setPrescriptions(resPrescriptions.data);
      }
    } catch (err) {
      console.error('[Doctor Fetch Error]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [activeTab]);

  // Handle Cancel Appointment
  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Cancel this consultation slot?')) return;
    try {
      await api.put(`/api/appointments/${id}`, { status: 'cancelled' });
      fetchDoctorData();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    }
  };

  // Prescription builder dynamic row controllers
  const handleAddRow = () => {
    setMedicineLines(prev => [...prev, { name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After meals' }]);
  };

  const handleRemoveRow = (index) => {
    setMedicineLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setMedicineLines(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  // Submission & client-side jsPDF generator
  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    if (!activeConsult) return;

    if (medicineLines.some(m => !m.name)) {
      alert('Please fill out medication names.');
      return;
    }

    try {
      // 1. Submit to backend
      const res = await api.post('/api/prescriptions', {
        patientId: activeConsult.patientId._id,
        appointmentId: activeConsult._id,
        medicines: medicineLines,
        notes: consultNotes
      });

      if (res.success) {
        // Download Branded Prescription
        generateBrandedPDF(activeConsult, medicineLines, consultNotes);

        // Reset workspace
        setActiveConsult(null);
        setMedicineLines([{ name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After meals' }]);
        setConsultNotes('');
        fetchDoctorData();
      }
    } catch (err) {
      alert(`Failed to save prescription: ${err.message}`);
    }
  };

  // Branded letterhead PDF generation logic
  const generateBrandedPDF = (appt, medicines, notes) => {
    const doc = new jsPDF();
    const patient = appt.patientId;

    // Aesthetically tailored header decoration
    doc.setFillColor(14, 140, 230); // brand color
    doc.rect(0, 0, 210, 15, 'F');

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('MEDPULSE AI DIGITAL CLINIC', 20, 10);

    // Doctor Details
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('Helvetica', 'normal');
    doc.text(`Practitioner: ${user.name}`, 20, 28);
    doc.text(`Specialty: ${user.specialization || 'Cardiology & General Care'}`, 20, 34);
    doc.text(`Clinic Line: ${user.contact || '+92 3348761317'}`, 20, 40);

    // Right Side Date
    const todayStr = new Date().toLocaleDateString();
    doc.text(`Date: ${todayStr}`, 150, 28);
    doc.text(`Rx ID: RX-${Math.floor(Math.random() * 90000) + 10000}`, 150, 34);

    // Separator line
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(20, 46, 190, 46);

    // Patient Details
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('PATIENT PROFILE RECORD', 20, 54);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Name: ${patient.name}`, 20, 60);
    doc.text(`Age/Gender: ${patient.age} years / ${patient.gender.toUpperCase()}`, 20, 66);
    doc.text(`Contact: ${patient.contact}`, 120, 60);
    doc.text(`Medical History: ${patient.medicalHistory.join(', ') || 'None reported'}`, 120, 66);

    // Table Header
    doc.setFillColor(248, 250, 252); // Slate-50
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
    medicines.forEach((med, idx) => {
      // Row alternate color
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
    const splitNotes = doc.splitTextToSize(notes || 'Complete full course as specified. Stay hydrated.', 170);
    doc.text(splitNotes, 20, yPos + 16);

    // Footnote
    doc.setFillColor(14, 140, 230);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Generated via MedPulse AI Smart Diagnostics System. Digital clinic certificate authenticated.', 45, 292);

    // Download
    doc.save(`Prescription_${patient.name.replace(' ', '_')}.pdf`);
  };

  // Google Gemini API symptom checking trigger
  const handleAiDiagnosis = async () => {
    if (!selectedPatientId || !symptomsInput) {
      alert('Please select a patient and input current symptoms.');
      return;
    }

    // SaaS Free Tier Intercept Check
    if (user.subscriptionPlan === 'free') {
      setUpgradeBlock(true);
      return;
    }

    setAiLoading(true);
    setAiDiagnostic(null);
    setAiRisk(null);
    
    try {
      const res = await api.post('/api/ai/diagnose', {
        patientId: selectedPatientId,
        symptoms: symptomsInput
      });
      if (res.success) {
        setAiDiagnostic(res.data.aiResponse);
      }
    } catch (err) {
      alert(`AI Diagnostics failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Google Gemini API Risk assessor trigger
  const handleAiRiskAssessment = async () => {
    if (!selectedPatientId || !symptomsInput) {
      alert('Please select a patient and input symptoms.');
      return;
    }

    if (user.subscriptionPlan === 'free') {
      setUpgradeBlock(true);
      return;
    }

    setAiLoading(true);
    setAiDiagnostic(null);
    setAiRisk(null);

    try {
      const res = await api.post('/api/ai/risk', {
        patientId: selectedPatientId,
        symptoms: symptomsInput
      });
      if (res.success) {
        setAiRisk(res.data);
      }
    } catch (err) {
      alert(`AI Risk assessment failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLiveUpgrade = async () => {
    try {
      await upgradePlan('pro');
      setUpgradeBlock(false);
      // Trigger diagnosis automatically now!
      alert('Congratulations! Pro subscription activated. You can now use Google Gemini Clinical diagnostics!');
    } catch (err) {
      alert('Upgrade failed');
    }
  };

  if (loading) return <Loading message="Loading practitioner console..." />;
  if (!stats) return <div className="p-8">Failed to download doctor metrics.</div>;

  return (
    <div className="p-8 space-y-8 fade-in">
      
      {/* 1. OVERVIEW SCREEN */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Today's Consultation Load"
              value={stats.stats.dailyAppointmentsCount}
              icon={CalendarDays}
              description="Visits scheduled for today"
              trend={{ type: 'up', value: 'Active queue' }}
              color="brand"
            />
            <StatCard
              title="Pending Queue Files"
              value={stats.stats.pendingAppointments}
              icon={Activity}
              description="Awaiting clinical check-in"
              color="rose"
            />
            <StatCard
              title="Completed Diagnostics"
              value={stats.stats.completedAppointments}
              icon={CheckCircle}
              description="Completed sessions today"
              color="emerald"
            />
            <StatCard
              title="Issued Prescriptions"
              value={stats.stats.totalPrescriptions}
              icon={FileSpreadsheet}
              description="Total pharmacy RXs printed"
              color="violet"
            />
          </div>

          {/* Recharts queue load */}
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Weekly Queue & Prescriptions Load</h4>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-clinical-500/10 text-clinical-500 px-2 py-0.5 rounded border border-clinical-500/20">Operational</span>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15}/>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false}/>
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false}/>
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}/>
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}/>
                  <Area type="monotone" name="Visits Queue" dataKey="queue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorQueue)" />
                  <Area type="monotone" name="Prescriptions Compiled" dataKey="prescriptions" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorRx)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* 2. APPOINTMENT QUEUE & BUILDER DESK */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {!activeConsult ? (
            <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Active Queue Registry</h3>
                <p className="text-xs text-slate-400">Select pending patient appointments to compile formulas or trigger diagnosis checkers.</p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No pending patients remaining in today's check-in queue.
                  </div>
                ) : (
                  appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').map((appt) => (
                    <div key={appt._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="font-bold text-slate-800 dark:text-white">{appt.patientId.name}</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-semibold uppercase">
                            {appt.patientId.gender} / {appt.patientId.age} yrs
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal max-w-lg">
                          <strong>Chief complaint:</strong> "{appt.reason}"
                        </p>
                        <p className="text-[10px] text-brand-500 font-medium mt-1">
                          Booking Target: {new Date(appt.date).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleCancelAppointment(appt._id)}
                          className="p-2.5 rounded-xl border border-rose-500/10 hover:border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all"
                          title="Cancel Slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveConsult(appt);
                            setMedicineLines([{ name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After meals' }]);
                          }}
                          className="flex items-center gap-1.5 bg-clinical-500 hover:bg-clinical-600 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
                        >
                          <span>Complete Consult</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Prescription & Consultation Workspace */
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Prescriptions Form */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                  <div>
                    <span className="text-[9px] uppercase font-extrabold tracking-widest text-brand-500 block mb-1">Active Consultation Portal</span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Prescription Desk & Dosage Planner</h3>
                  </div>
                  <button
                    onClick={() => setActiveConsult(null)}
                    className="border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold px-3 py-2 rounded-xl text-xs uppercase tracking-wider transition-all dark:text-slate-300"
                  >
                    Cancel Workspace
                  </button>
                </div>

                <div className="glass-card p-6 md:p-8 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-6">
                  {/* Active Patient summary */}
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Patient Name</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white truncate block">{activeConsult.patientId.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Age & Gender</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">{activeConsult.patientId.age} yrs / {activeConsult.patientId.gender.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Contact Phone</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">{activeConsult.patientId.contact}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Medical History</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate block">{activeConsult.patientId.medicalHistory.join(', ') || 'No chronic records'}</span>
                    </div>
                  </div>

                  <form onSubmit={handleIssuePrescription} className="space-y-6">
                    {/* Real-time Allergy Alerts */}
                    {getActiveAllergyWarnings().length > 0 && (
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs space-y-2 animate-pulse">
                        {getActiveAllergyWarnings().map((warn, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span className="font-bold">{warn}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Medications List (Rx)</label>
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider text-brand-500 hover:text-brand-600 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Medicine Row</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {medicineLines.map((med, index) => (
                          <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                            <div className="w-full md:flex-1">
                              <input
                                type="text"
                                value={med.name}
                                onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                                placeholder="Medicine Name (e.g. Amoxicillin)"
                                list="common-medications"
                                required
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                              />
                            </div>
                            <div className="w-full md:w-32">
                              <input
                                type="text"
                                value={med.dosage}
                                onChange={(e) => handleRowChange(index, 'dosage', e.target.value)}
                                placeholder="Dosage (e.g. 1-0-1)"
                                required
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                              />
                            </div>
                            <div className="w-full md:w-32">
                              <input
                                type="text"
                                value={med.duration}
                                onChange={(e) => handleRowChange(index, 'duration', e.target.value)}
                                placeholder="Duration (e.g. 5 days)"
                                required
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                              />
                            </div>
                            <div className="w-full md:w-44">
                              <input
                                type="text"
                                value={med.instructions}
                                onChange={(e) => handleRowChange(index, 'instructions', e.target.value)}
                                placeholder="Take after meals"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                              />
                            </div>
                            {medicineLines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(index)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Doctor's Directives / Lifestyle Advice</label>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'cardiology') {
                              setConsultNotes(`SUBJECTIVE:\n- Patient complains of mild chest tightness and fatigue after walking.\n\nOBJECTIVE:\n- BP: 130/85 mmHg.\n- Heart Rate: 78 bpm, regular rhythm.\n\nASSESSMENT:\n- Mild hypertensive cardiovascular strain.\n\nPLAN:\n- Prescribed amlodipine formula.\n- Limit sodium intake. Schedule 4-week follow-up.`);
                            } else if (val === 'fever') {
                              setConsultNotes(`SUBJECTIVE:\n- Patient presents with acute fever (101°F), chills, and body aches starting 2 days ago.\n\nOBJECTIVE:\n- Temp: 101.2 °F.\n- Throat: Mild erythema, no exudate.\n\nASSESSMENT:\n- Acute viral respiratory infection.\n\nPLAN:\n- Take Paracetamol 500mg as needed.\n- Increase fluid intake. Rest for 3 days.`);
                            } else if (val === 'hypertension') {
                              setConsultNotes(`SUBJECTIVE:\n- Patient here for routine blood pressure follow-up.\n\nOBJECTIVE:\n- BP: 142/90 mmHg (elevated).\n\nASSESSMENT:\n- Primary hypertension, suboptimal control.\n\nPLAN:\n- Adjust medication dosage. Review diet logs.\n- Daily BP monitoring at home.`);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-500 dark:text-slate-400 font-bold focus:outline-none"
                        >
                          <option value="">-- Apply SOAP Note Template --</option>
                          <option value="cardiology">Cardiology Consult SOAP Template</option>
                          <option value="fever">Acute Viral/Fever SOAP Template</option>
                          <option value="hypertension">Hypertension Follow-Up SOAP Template</option>
                        </select>
                      </div>
                      <textarea
                        value={consultNotes}
                        onChange={(e) => setConsultNotes(e.target.value)}
                        placeholder="Limit salt intake. Complete antibiotic course. Stay hydrated and return in 2 weeks."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all resize-none font-mono"
                      ></textarea>
                    </div>

                    <datalist id="common-medications">
                      {COMMON_MEDS.map((med, i) => (
                        <option key={i} value={med} />
                      ))}
                    </datalist>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-clinical-600 to-brand-600 hover:from-clinical-700 hover:to-brand-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 hover:shadow-lg shadow-clinical-500/10 flex items-center justify-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Issue Prescription & Download PDF Letterhead</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* AI Diagnostic helper box on side */}
              <div className="space-y-6">
                <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-clinical-500" /> Consult AI Diagnosis Helper
                  </h4>
                  
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Need a second clinical opinion? Submit symptoms to the Google Gemini diagnostics analyzer directly from this side-desk.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Diagnosing Patient:</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white">{activeConsult.patientId.name}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Submitted Symptoms</span>
                      <textarea
                        value={symptomsInput}
                        onChange={(e) => setSymptomsInput(e.target.value)}
                        placeholder="e.g. Chest discomfort, high blood pressure spikes, cough"
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(activeConsult.patientId._id);
                        handleAiDiagnosis();
                      }}
                      disabled={aiLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-clinical-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-brand-500/10 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiLoading ? 'Analyzing...' : 'AI Symptom Checker'}</span>
                    </button>
                  </div>
                </div>

                {/* AI diagnostic response */}
                {aiDiagnostic && (
                  <div className="glass-card p-6 border border-clinical-500/20 bg-clinical-500/5 shadow-inner space-y-4 fade-in">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-clinical-500" />
                        AI Diagnostic Outline
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Risk Evaluation</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                          aiDiagnostic.riskLevel === 'high' 
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                            : aiDiagnostic.riskLevel === 'medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {aiDiagnostic.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5">Pathology Likelihood</span>
                        <div className="space-y-2">
                          {aiDiagnostic.possibleDiseases.map((d, i) => (
                            <div key={i} className="text-xs bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-800 dark:text-white">{d.name}</span>
                                <span className="font-semibold text-clinical-500">{d.probability}%</span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal">{d.description}</p>
                              
                              {/* progress bar */}
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-clinical-500 rounded-full" style={{ width: `${d.probability}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Suggested Lab Panels</span>
                        <ul className="list-disc pl-4 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 mt-1 font-semibold">
                          {aiDiagnostic.suggestedTests.map((t, idx) => <li key={idx}>{t}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* 3. AI SMART DIAGNOSIS HUB PANEL */}
      {activeTab === 'diagnose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Diagnostic Console Inputs */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">AI Clinical diagnostic Desk</h3>
                <p className="text-xs text-slate-400">Trigger patient diagnostics checkers powered by Google Gemini-1.5-Flash.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Select Patient File</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => {
                      setSelectedPatientId(e.target.value);
                      setAiDiagnostic(null);
                      setAiRisk(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                  >
                    <option value="">-- Choose Patient Demographics --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.gender}, {p.age} years)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Describe Chief Complaint Symptoms</label>
                  <textarea
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    placeholder="Describe symptoms in detail. e.g. severe headache for 3 days, accompanied by nausea, high fever, and sensitivity to light."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white resize-none"
                  ></textarea>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={handleAiDiagnosis}
                    disabled={aiLoading}
                    className="w-full bg-gradient-to-r from-brand-600 to-clinical-600 hover:from-brand-700 hover:to-clinical-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-brand-500/10 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{aiLoading ? 'Evaluating symptoms...' : 'AI Symptom Checker'}</span>
                  </button>

                  <button
                    onClick={handleAiRiskAssessment}
                    disabled={aiLoading}
                    className="w-full border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4 text-violet-500" />
                    <span>{aiLoading ? 'Scanning hazards...' : 'Scan Chronic Health Risks'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Outputs display panel */}
          <div className="lg:col-span-2">
            
            {/* Loading Indicator */}
            {aiLoading && <Loading message="Querying Gemini AI diagnostics server..." />}

            {/* AI Diagnostics Panel */}
            {!aiLoading && aiDiagnostic && (
              <div className="glass-card p-6 md:p-8 bg-white dark:bg-slate-900/60 border border-clinical-500/20 shadow-md space-y-6 fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Intellgence Gateway Node</span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-500 animate-spin" />
                      Gemini Clinical Diagnostic Report
                    </h3>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    aiDiagnostic.riskLevel === 'high'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : aiDiagnostic.riskLevel === 'medium'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {aiDiagnostic.riskLevel.toUpperCase()} RISK RATING
                  </span>
                </div>

                {/* Possible Diseases Grid */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Potential Pathologies Likelihood</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiDiagnostic.possibleDiseases.map((d, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850/60 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-white text-xs">{d.name}</span>
                          <span className="text-xs font-bold text-clinical-500">{d.probability}%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{d.description}</p>
                        
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-clinical-500 rounded-full" style={{ width: `${d.probability}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diagnostics and reasoning */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  
                  <div className="md:col-span-2 space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Reasoning Summary</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed italic">
                      "{aiDiagnostic.clinicalReasoning}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suggested Lab Panels</h5>
                    <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-semibold">
                      {aiDiagnostic.suggestedTests.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>

                </div>
              </div>
            )}

            {/* AI Risk Assessment Panel */}
            {!aiLoading && aiRisk && (
              <div className="glass-card p-6 md:p-8 bg-white dark:bg-slate-900/60 border border-violet-500/20 shadow-md space-y-6 fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Chronic Risk Flagger</span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-violet-500 animate-pulse" />
                      Multiphase Pathology Risk Audit
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">HAZARD SCORE INDEX:</span>
                    <span className="text-sm font-extrabold text-white bg-violet-600 px-3 py-1 rounded-xl">
                      {aiRisk.riskScore} / 10
                    </span>
                  </div>
                </div>

                {/* Urgent Warning if any */}
                {aiRisk.urgentAlert && (
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs flex gap-3 items-start animate-pulse">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <h5 className="font-bold mb-1">CRITICAL CLINICAL ADVISORY ALERT:</h5>
                      <p className="leading-normal">{aiRisk.urgentAlert}</p>
                    </div>
                  </div>
                )}

                {/* Detected Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identified Co-Morbidities / chronic trends</h4>
                    <div className="space-y-2">
                      {aiRisk.detectedRisks.map((r, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Preventative Actions</h4>
                    <ul className="space-y-2">
                      {aiRisk.preventativeActions.map((a, i) => (
                        <li key={i} className="flex gap-2 items-start text-xs text-slate-500 dark:text-slate-400">
                          <CheckCircle className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!aiLoading && !aiDiagnostic && !aiRisk && (
              <div className="glass-card p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-400 min-h-[300px] flex flex-col justify-center items-center">
                <BrainCircuit className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3 pulse-indicator" />
                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-450 uppercase tracking-wider mb-2">Awaiting Diagnostic Ingestion</h4>
                <p className="text-xs text-slate-400 max-w-sm leading-normal">Select a patient demographic file, outline the active complaint symptoms, and choose symptom check or health risk scan options.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. HISTORICAL PRESCRIPTIONS LIST */}
      {activeTab === 'prescriptions' && (
        <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Prescription Documents Archive</h3>
            <p className="text-xs text-slate-400">Review or download medical prescriptions compiled by you.</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {prescriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No medication formulas written yet.
              </div>
            ) : (
              prescriptions.map((pr) => (
                <div key={pr._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 flex justify-between items-center gap-4 transition-all">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-800 dark:text-white">{pr.patientId.name}</span>
                      <span className="text-[9px] bg-clinical-500/10 text-clinical-600 px-2 py-0.5 rounded font-bold uppercase border border-clinical-500/20">
                        {pr.medicines.length} Medicines
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-lg truncate leading-normal">
                      <strong>Directive:</strong> "{pr.notes || 'No custom directives.'}"
                    </p>
                    <span className="text-[9px] text-slate-500 mt-1 block">
                      Issued Date: {new Date(pr.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => generateBrandedPDF(pr, pr.medicines, pr.notes)}
                    className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all dark:text-slate-350 shrink-0"
                  >
                    <FileDown className="w-4 h-4 text-brand-500" />
                    <span>Download PDF</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SAAS PRO UPGRADE MODAL INTERCEPT */}
      {upgradeBlock && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn animate-pulse">
          <div className="glass-card p-8 border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 max-w-sm text-center shadow-2xl relative space-y-6">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 p-3 rounded-full shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <div className="pt-4">
              <span className="text-[9px] uppercase font-extrabold tracking-widest bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded border border-amber-500/20">
                PRO PLAN EXCLUSIVE FEATURE
              </span>
              <h3 className="text-lg font-bold text-white mt-4">Unlock Google Gemini Diagnostics</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                AI Smart Symptom Checkers, Chronic Risk Combination Flaggers, and Urdu explanations are premium capabilities.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px] text-left text-slate-400 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Unlimited Patient Registrations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Google Gemini AI symptom analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Bilingual prescription translations</span>
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
                onClick={handleLiveUpgrade}
                className="flex-1 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider hover:shadow-lg shadow-amber-500/20 transition-all"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;
