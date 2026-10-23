import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { 
  Users, UserPlus, CalendarPlus, Trash2, Edit, AlertTriangle, 
  Sparkles, CheckCircle, Smartphone, Send, PhoneCall 
} from 'lucide-react';

const ReceptionistDashboard = ({ activeTab }) => {
  const { user, upgradePlan } = useAuth();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Patient Form State
  const [patName, setPatName] = useState('');
  const [patAge, setPatAge] = useState('');
  const [patGender, setPatGender] = useState('male');
  const [patContact, setPatContact] = useState('');
  const [patHistoryInput, setPatHistoryInput] = useState('');
  const [patientLimitBlock, setPatientLimitBlock] = useState(false);

  // Appointment Form State
  const [bookPatId, setBookPatId] = useState('');
  const [bookDocId, setBookDocId] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookReason, setBookReason] = useState('General Health Assessment');

  // Roster feedback logs
  const [feedbackLog, setFeedbackLog] = useState('');
  const [formError, setFormError] = useState('');

  const fetchReceptionistData = async () => {
    setLoading(true);
    try {
      const resPatients = await api.get('/api/patients');
      if (resPatients.success) {
        setPatients(resPatients.data);
      }

      const resStaff = await api.get('/api/users/staff');
      if (resStaff.success) {
        setDoctors(resStaff.data.filter(s => s.role === 'doctor'));
      }

      const resAppts = await api.get('/api/appointments');
      if (resAppts.success) {
        setAppointments(resAppts.data);
      }
    } catch (err) {
      console.error('[Receptionist Fetch Error]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionistData();
  }, [activeTab]);

  // Handle Patient Registration
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setFormError('');
    setFeedbackLog('');
    setPatientLimitBlock(false);

    if (!patName || !patAge || !patContact) {
      setFormError('Please enter name, age, and contact.');
      return;
    }

    try {
      const historyArr = patHistoryInput ? patHistoryInput.split(',').map(s => s.trim()) : [];
      const res = await api.post('/api/patients', {
        name: patName,
        age: parseInt(patAge),
        gender: patGender,
        contact: patContact,
        medicalHistory: historyArr
      });

      if (res.success) {
        // Trigger simulated WhatsApp reminder
        triggerSimulatedSMS(patName, patContact, 'Welcome! Your digital clinic patient profile has been registered successfully.');

        // Reset
        setPatName('');
        setPatAge('');
        setPatGender('male');
        setPatContact('');
        setPatHistoryInput('');
        fetchReceptionistData();
      }
    } catch (err) {
      if (err.limitReached) {
        setPatientLimitBlock(true);
      } else {
        setFormError(err.message || 'Failed to register patient.');
      }
    }
  };

  // Handle Booking Appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setFormError('');
    setFeedbackLog('');

    if (!bookPatId || !bookDocId || !bookDate) {
      setFormError('Please select a patient, doctor, and date.');
      return;
    }

    try {
      const res = await api.post('/api/appointments', {
        patientId: bookPatId,
        doctorId: bookDocId,
        date: bookDate,
        reason: bookReason
      });

      if (res.success) {
        const patient = patients.find(p => p._id === bookPatId);
        const doctor = doctors.find(d => d._id === bookDocId);

        // Trigger SMS notification
        const timeStr = new Date(bookDate).toLocaleString();
        triggerSimulatedSMS(
          patient.name, 
          patient.contact, 
          `Confirmed: Your consultation slot with ${doctor.name} is booked for ${timeStr}.`
        );

        // Reset
        setBookPatId('');
        setBookDocId('');
        setBookDate('');
        setBookReason('General Health Assessment');
        fetchReceptionistData();
      }
    } catch (err) {
      setFormError(err.message || 'Booking failed.');
    }
  };

  // Delete Patient
  const handleDeletePatient = async (id) => {
    if (!window.confirm('Delete this patient profile from registry? This action is permanent.')) return;
    try {
      const res = await api.delete(`/api/patients/${id}`);
      if (res.success) {
        fetchReceptionistData();
      }
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  // Simulated SMS/WhatsApp Trigger
  const triggerSimulatedSMS = (patientName, contact, msg) => {
    setFeedbackLog(`WhatsApp & SMS reminder successfully dispatched to ${patientName} (${contact}): "${msg}"`);
    // Clear after 8s
    setTimeout(() => {
      setFeedbackLog('');
    }, 8000);
  };

  const handleUpgradeClinic = async () => {
    try {
      await upgradePlan('pro');
      setPatientLimitBlock(false);
      alert('Congratulations! Upgraded clinic to Pro. Patient registry limit removed.');
      fetchReceptionistData();
    } catch (err) {
      alert('Upgrade failed');
    }
  };

  if (loading) return <Loading message="Syncing operational grid..." />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 fade-in">

      {/* Simulated Notification Alerts */}
      {feedbackLog && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl flex gap-3 items-center text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-md pulse-indicator animate-pulse">
          <PhoneCall className="w-5 h-5 text-emerald-500 shrink-0" />
          <p>{feedbackLog}</p>
        </div>
      )}

      {/* 1. PATIENT REGISTRY WORKSPACE */}
      {activeTab === 'patients' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Registration Desk Form */}
          <div className="xl:col-span-1 space-y-6">
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Patient registration Desk</h3>
                <p className="text-xs text-slate-400">Register patient demographics and medical files inside the clinic directory.</p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Patient limit reached blocker */}
              {patientLimitBlock && (
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs space-y-3">
                  <div className="flex gap-2 items-start font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <span>Free Tier Patient Limit Reached (Max 5)</span>
                  </div>
                  <p className="leading-normal">
                    Free Clinic Accounts are capped at 5 patient profiles. Upgrade to the Pro Plan to enjoy unlimited patient registries, Gemini AI diagnoses, and billing modules.
                  </p>
                  <button
                    onClick={handleUpgradeClinic}
                    className="w-full bg-gradient-to-r from-amber-500 to-brand-600 hover:from-amber-600 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all"
                  >
                    Upgrade Clinic to Pro
                  </button>
                </div>
              )}

              <form onSubmit={handleRegisterPatient} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={patName}
                    onChange={(e) => setPatName(e.target.value)}
                    placeholder="e.g. Asad"
                    required
                    disabled={patientLimitBlock}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={patAge}
                      onChange={(e) => setPatAge(e.target.value)}
                      placeholder="e.g. 35"
                      required
                      disabled={patientLimitBlock}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Gender</label>
                    <select
                      value={patGender}
                      onChange={(e) => setPatGender(e.target.value)}
                      disabled={patientLimitBlock}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Patient Phone / Contact</label>
                  <input
                    type="text"
                    value={patContact}
                    onChange={(e) => setPatContact(e.target.value)}
                    placeholder="e.g. 0333-XXXXXXX"
                    required
                    disabled={patientLimitBlock}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Medical History Flags (Comma Separated)</label>
                  <input
                    type="text"
                    value={patHistoryInput}
                    onChange={(e) => setPatHistoryInput(e.target.value)}
                    placeholder="e.g. Asthma, High Cholesterol, Insomnia"
                    disabled={patientLimitBlock}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={patientLimitBlock}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-brand-500/10 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Patient File</span>
                </button>
              </form>
            </div>
          </div>

          {/* Roster list */}
          <div className="xl:col-span-2 space-y-6">
            <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Active Patient Directory</h3>
                  <p className="text-xs text-slate-400">Roster listing of all registered patients profile cards.</p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-slate-200 dark:border-slate-750/60 text-slate-500">
                  {patients.length} Registered
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {patients.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No active patients profiles found.
                  </div>
                ) : (
                  patients.map((pat) => (
                    <div key={pat._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{pat.name}</span>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded font-extrabold text-slate-500 uppercase border border-slate-200 dark:border-slate-700">
                            {pat.gender} / {pat.age} yrs
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          <strong>Contact Phone:</strong> {pat.contact}
                        </p>
                        {pat.medicalHistory && pat.medicalHistory.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pat.medicalHistory.map((h, i) => (
                              <span key={i} className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-rose-500/5 text-rose-500 border border-rose-500/10">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeletePatient(pat._id)}
                          className="p-2 rounded-xl border border-transparent hover:border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition-all"
                          title="Remove profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. APPOINTMENT SCHEDULER WIZARD */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Scheduling Form */}
          <div className="xl:col-span-1 space-y-6">
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Book Consultation Slot</h3>
                <p className="text-xs text-slate-400">Match active patients with designated clinical Doctors.</p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Select Patient File</label>
                  <select
                    value={bookPatId}
                    onChange={(e) => setBookPatId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                  >
                    <option value="">-- Choose Patient Registry --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.gender}, {p.age} years)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Designate Doctor</label>
                  <select
                    value={bookDocId}
                    onChange={(e) => setBookDocId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                  >
                    <option value="">-- Choose Specialization Doctor --</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.specialization || 'General Care'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Appointment Target Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Chief Reason for Consultation</label>
                  <input
                    type="text"
                    value={bookReason}
                    onChange={(e) => setBookReason(e.target.value)}
                    placeholder="e.g. Cough and respiratory strain"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-600 to-clinical-600 hover:from-brand-700 hover:to-clinical-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-brand-500/10 flex items-center justify-center gap-2 mt-4"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Confirm Scheduling Slot</span>
                </button>
              </form>
            </div>
          </div>

          {/* Appointments Log lists */}
          <div className="xl:col-span-2 space-y-6">
            <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Clinic Scheduled Queue</h3>
                <p className="text-xs text-slate-400">Registry list of active scheduled consultations calendar.</p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {appointments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No clinical appointments scheduled.
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div key={appt._id} className="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center transition-all">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-slate-800 dark:text-white">{appt.patientId.name}</span>
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
                          Consulting: <strong>{appt.doctorId.name}</strong> ({appt.doctorId.specialization || 'Cardiology'})
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Scheduled: {new Date(appt.date).toLocaleString()} | Complaint: "{appt.reason}"
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReceptionistDashboard;
