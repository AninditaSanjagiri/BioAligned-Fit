import { useState } from "react";
import { motion } from "framer-motion";
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Updated to track exactly what the backend needs
  const [formData, setFormData] = useState({
    username: "",
    dob: "",
    height: "",
    weight: "",
    cycleLength: "",
    lastPeriod: "",
    trainingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    sleepHours: "7",
    goal: "Build Strength & Muscle"
  });

  const daysOfWeek = [
    { label: 'M', value: 'Mon' }, { label: 'T', value: 'Tue' }, { label: 'W', value: 'Wed' },
    { label: 'T', value: 'Thu' }, { label: 'F', value: 'Fri' }, { label: 'S', value: 'Sat' }, { label: 'S', value: 'Sun' }
  ];

  const toggleDay = (dayValue) => {
    const newDays = formData.trainingDays.includes(dayValue)
      ? formData.trainingDays.filter(d => d !== dayValue)
      : [...formData.trainingDays, dayValue];
    setFormData({ ...formData, trainingDays: newDays });
  };

  const handleNext = async (e) => {
    e.preventDefault();
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Step 4: Save to Firestore!
      setIsSaving(true);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");

        // Convert HTML date strings into JavaScript Date objects
        const dobDate = new Date(formData.dob);
        const lastPeriodDate = new Date(formData.lastPeriod);

        // Save to Firestore under the 'users' collection using their secure UID
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          display_name: formData.username,
          date_of_birth: dobDate,
          height_cm: Number(formData.height),
          weight_kg: Number(formData.weight),
          average_cycle_length: Number(formData.cycleLength),
          last_period_start: lastPeriodDate,
          training_days: formData.trainingDays,
          sleep_hours: Number(formData.sleepHours),
          primary_goal: formData.goal,
          created_at: serverTimestamp()
        }, { merge: true });

        onComplete(); // Finishes onboarding and goes to the main app dashboard
      } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile. Please try again.");
        setIsSaving(false);
      }
    }
  };

  const steps = [
    { id: 1, name: "Profile", icon: "👤" },
    { id: 2, name: "Cycle", icon: "↻" },
    { id: 3, name: "Lifestyle", icon: "🌿" },
    { id: 4, name: "Goals", icon: "🎯" }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 flex flex-col">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-purple-600 text-2xl">🌿</span>
          <span className="text-xl font-bold tracking-tight">BioAligned-Fit</span>
        </div>
        <button 
          onClick={onComplete}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2"
        >
          Save & Exit <img src="https://i.pravatar.cc/150?img=5" alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex max-w-6xl mx-auto w-full px-8 pb-12 gap-16 items-start mt-4">
        
        {/* Left Side Graphic Panel */}
        <div className="hidden md:flex w-1/3 relative h-[650px] bg-gradient-to-b from-[#F6F0F2] to-[#EAE0E4] rounded-[2rem] overflow-hidden flex-col items-center p-10 shadow-sm border border-pink-50/50">
          <h2 className="text-3xl font-serif italic text-gray-800 text-center leading-tight mt-8 relative z-10">
            Different <br /> phases. <br /> Same powerful you. <br />
            <span className="text-pink-400 font-sans not-italic text-2xl">♡</span>
          </h2>
          <img 
            src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2069&auto=format&fit=crop" 
            alt="Woman stretching" 
            className="absolute bottom-0 left-0 right-0 w-full h-[60%] object-cover object-top mix-blend-multiply opacity-90 rounded-b-[2rem]"
          />
        </div>

        {/* Right Side Form Panel */}
        <div className="w-full md:w-2/3 max-w-lg mx-auto py-4">
          
          {/* Progress Stepper */}
          <div className="flex items-center justify-between mb-16 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 -z-10"></div>
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-[#FDFDFD] px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors ${
                  step >= s.id ? "bg-purple-100 text-purple-700 border-2 border-purple-200" : "bg-white text-gray-400 border-2 border-gray-100"
                }`}>
                  {step > s.id ? "✓" : s.icon}
                </div>
                <span className={`text-xs font-medium ${step >= s.id ? "text-gray-900" : "text-gray-400"}`}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>

          {/* Form Content */}
          <motion.div 
            key={step} 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h1>
            <p className="text-gray-500 mb-10">This helps us personalize your workout recommendations.</p>

            <form onSubmit={handleNext} className="space-y-6">
              
              {/* STEP 1: Profile (NOW WITH USERNAME) */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                    <input 
                      type="text" required placeholder="What should we call you?"
                      value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                      <input type="number" required value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                      <input type="number" required value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input type="date" required value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Cycle */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Average Cycle Length (Days)</label>
                    <input 
                      type="number" required min="20" max="45"
                      value={formData.cycleLength} onChange={(e) => setFormData({...formData, cycleLength: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Period Start Date</label>
                    <input 
                      type="date" required 
                      value={formData.lastPeriod} onChange={(e) => setFormData({...formData, lastPeriod: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                    <p className="text-xs text-gray-400 mt-2">We use this to dynamically calculate your current phase every day.</p>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Lifestyle */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Training Days</label>
                    <div className="flex gap-2 w-full">
                      {daysOfWeek.map((day, i) => (
                        <label key={i} className="flex-1 text-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="peer sr-only" 
                            checked={formData.trainingDays.includes(day.value)}
                            onChange={() => toggleDay(day.value)}
                          />
                          <div className="py-3 rounded-xl border border-gray-200 peer-checked:bg-purple-100 peer-checked:border-purple-400 peer-checked:text-purple-700 text-sm font-bold transition-all text-gray-400 hover:bg-gray-50">
                            {day.label}
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Select all the days you realistically want to work out.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Average Daily Sleep (Hours)</label>
                    <input 
                      type="number" required step="0.5"
                      value={formData.sleepHours} onChange={(e) => setFormData({...formData, sleepHours: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Goals */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Focus</label>
                  {[
                    { title: "Build Strength & Muscle", desc: "Focus on progressive overload and hypertrophy." },
                    { title: "Fat Loss & Endurance", desc: "Focus on metabolic conditioning and cardiovascular health." },
                    { title: "Hormonal Balance", desc: "Focus on cortisol management and nervous system recovery." },
                    { title: "General Fitness & Energy", desc: "Focus on daily movement and vitality." }
                  ].map((goal, i) => (
                    <label key={i} className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all group ${
                      formData.goal === goal.title ? "border-purple-500 bg-purple-50/50" : "border-gray-200 hover:border-purple-400 hover:bg-purple-50/30"
                    }`}>
                      <input 
                        type="radio" 
                        name="goal" 
                        value={goal.title}
                        checked={formData.goal === goal.title}
                        onChange={(e) => setFormData({...formData, goal: e.target.value})}
                        className="w-4 h-4 mt-1 text-purple-600 focus:ring-purple-500" 
                      />
                      <div>
                        <span className={`block font-bold mb-1 ${formData.goal === goal.title ? "text-purple-900" : "text-gray-900 group-hover:text-purple-900"}`}>
                          {goal.title}
                        </span>
                        <span className="block text-xs text-gray-500">{goal.desc}</span>
                      </div>
                    </label>
                  ))}
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8 pt-4">
                {step > 1 && (
                  <button 
                    type="button" 
                    onClick={() => setStep(step - 1)}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-4 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-medium py-4 rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {step === 4 ? "Complete Profile" : "Next"} <span className="text-lg">→</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}