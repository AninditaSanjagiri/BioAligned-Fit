import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs } from "firebase/firestore";

import CycleInsights from "./CycleInsights";
import VideoLibrary from "./VideoLibrary";
import ProgressCharts from "./ProgressCharts";
import Profile from "./Profile";

export default function Dashboard({ onLogout, onGenerateWorkout, onStartSavedWorkout, biometrics, setBiometrics, savedWorkout, isWorkoutComplete }) {
  const [activeModal, setActiveModal] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalStreak, setGlobalStreak] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());

        const sessionsSnap = await getDocs(query(collection(db, "users", auth.currentUser.uid, "completed_sessions"), orderBy("date", "asc")));
        let current = 0;
        if (!sessionsSnap.empty) {
          const dates = [...new Set(sessionsSnap.docs.map(d => {
            const dateVal = d.data().date;
            return dateVal ? new Date(dateVal.toDate()).setHours(0,0,0,0) : null;
          }).filter(d => d !== null))];
          
          if(dates.length > 0) {
              current = 1;
              for (let i = 1; i < dates.length; i++) {
                if ((dates[i] - dates[i-1]) / 86400000 === 1) current++;
                else current = 1;
              }
              const diffFromToday = (new Date().setHours(0,0,0,0) - dates[dates.length - 1]) / 86400000;
              if (diffFromToday > 1) current = 0;
          }
        }
        setGlobalStreak(current);
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && auth.currentUser) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target.result;
        setUserData(prev => ({ ...prev, profile_picture: base64Image }));
        await setDoc(doc(db, "users", auth.currentUser.uid), { profile_picture: base64Image }, { merge: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const rawName = userData?.display_name || auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : "Athlete");
  const formattedName = rawName.split(' ')[0].charAt(0).toUpperCase() + rawName.split(' ')[0].slice(1);
  
  // Safely extract the year, handling raw strings, timestamps, or empty data
  let userYear = new Date().getFullYear();
  if (userData?.created_at) {
    userYear = typeof userData.created_at.toDate === 'function' 
      ? userData.created_at.toDate().getFullYear() 
      : new Date(userData.created_at).getFullYear();
  }

  let cycleLength = userData?.average_cycle_length || 28;
  let currentDay = 1;
  if (userData?.last_period_start) {
    const safeDate = typeof userData.last_period_start.toDate === 'function' ? userData.last_period_start.toDate() : new Date(userData.last_period_start);
    const diffTime = Math.abs(new Date() - safeDate);
    currentDay = (Math.floor(diffTime / (1000 * 60 * 60 * 24)) % cycleLength) + 1;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  };

  const getPhaseInfo = (day) => {
    const scale = cycleLength / 28.0;
    if (day <= Math.ceil(5 * scale)) return { name: "Menstrual Phase", color: "text-red-500", dot: "bg-red-500", bg: "bg-red-50", desc: "A time for rest, reflection, and gentle movement like yin yoga or walking." };
    if (day <= Math.ceil(13 * scale)) return { name: "Follicular Phase", color: "text-purple-400", dot: "bg-purple-400", bg: "bg-purple-50", desc: "Energy is rising. A great time to build strength, try new challenges, and focus on progression." };
    if (day <= Math.ceil(16 * scale)) return { name: "Ovulatory Phase", color: "text-pink-400", dot: "bg-pink-400", bg: "bg-pink-50", desc: "Peak energy and strength. Push your limits with high-intensity interval training or heavy lifting." };
    return { name: "Luteal Phase", color: "text-blue-400", dot: "bg-blue-400", bg: "bg-blue-50", desc: "Energy gradually declines. Focus on steady-state cardio, mobility, and maintaining form." };
  };
  const phase = getPhaseInfo(currentDay);

  const renderModalContent = () => {
    if (activeModal === "energy") {
      return (
        <>
          <h3 className="text-2xl font-serif text-gray-900 mb-2">Daily Energy</h3>
          <p className="text-gray-500 mb-6">How are your physical energy levels feeling today?</p>
          <div className="space-y-3">
            {["Very Low", "Low", "Moderate", "High", "Very High"].map((opt) => (
              <button key={opt} onClick={() => { setBiometrics({...biometrics, energy: opt}); setActiveModal(null); }} className="w-full py-4 px-6 rounded-xl border border-gray-200 text-left font-medium hover:border-purple-400 hover:bg-purple-50 transition-all">{opt}</button>
            ))}
          </div>
        </>
      );
    }
    if (activeModal === "mood") {
      return (
        <>
          <h3 className="text-2xl font-serif text-gray-900 mb-2">Current Mood</h3>
          <p className="text-gray-500 mb-6">How is your mental space right now?</p>
          <div className="space-y-3">
            {["Low / Anxious", "Flat", "Calm & Stable", "Positive", "Highly Motivated"].map((opt) => (
              <button key={opt} onClick={() => { setBiometrics({...biometrics, mood: opt}); setActiveModal(null); }} className="w-full py-4 px-6 rounded-xl border border-gray-200 text-left font-medium hover:border-purple-400 hover:bg-purple-50 transition-all">{opt}</button>
            ))}
          </div>
        </>
      );
    }
    if (activeModal === "stress") {
      return (
        <>
          <h3 className="text-2xl font-serif text-gray-900 mb-2">Stress Level</h3>
          <p className="text-gray-500 mb-6">How much psychological or work stress are you carrying?</p>
          <div className="space-y-3">
            {["Minimal", "Moderate", "High", "Overwhelming"].map((opt) => (
              <button key={opt} onClick={() => { setBiometrics({...biometrics, stress: opt}); setActiveModal(null); }} className="w-full py-4 px-6 rounded-xl border border-gray-200 text-left font-medium hover:border-purple-400 hover:bg-purple-50 transition-all">{opt}</button>
            ))}
          </div>
        </>
      );
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-gray-900 flex overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#FDFCFB] border-r border-gray-100 flex flex-col justify-between hidden lg:flex flex-shrink-0 z-40">
        <div>
          <div className="px-8 pt-10 pb-8 hover:opacity-80 transition-opacity cursor-pointer">
            <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <span className="text-purple-700 text-2xl">🌿</span> BioAligned
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mt-1">Cycle Aware. Stronger You.</p>
          </div>
          
          <nav className="px-4 space-y-2 mt-4">
            <button onClick={() => setActiveTab("home")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'home' ? 'bg-purple-50 text-purple-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'}`}>
              <span className="text-xl">🏠</span> Home
            </button>
            <button onClick={() => setActiveTab("my_plan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'my_plan' ? 'bg-purple-50 text-purple-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'}`}>
              <span className="text-xl">📋</span> My Plan
            </button>
            <button onClick={() => setActiveTab("cycle_insights")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'cycle_insights' ? 'bg-purple-50 text-purple-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'}`}>
              <span className="text-xl">🧬</span> Cycle Insights
            </button>
            <button onClick={() => setActiveTab("workouts")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'workouts' ? 'bg-purple-50 text-purple-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'}`}>
              <span className="text-xl">▶️</span> Workouts
            </button>
            <button onClick={() => setActiveTab("progress")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'progress' ? 'bg-purple-50 text-purple-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'}`}>
              <span className="text-xl">📈</span> Progress
            </button>
            <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'profile' ? 'bg-purple-50 text-purple-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'}`}>
              <span className="text-xl">👤</span> Profile
            </button>
          </nav>
        </div>
        
        <div className="p-6 relative">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-all w-full">
            Log Out
          </button>
        </div>
      </aside>

      {/* CENTER CONTENT */}
      <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 lg:py-10 pb-28 relative">
        
        {/* MOBILE TOP HEADER (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <span className="text-purple-700">🌿</span> BioAligned
          </h2>
          <button onClick={onLogout} className="text-xs font-bold tracking-widest uppercase text-red-500 bg-red-50 px-4 py-2 rounded-full">
            Log Out
          </button>
        </div>

        {activeTab === "home" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* HERO CARD */}
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4 pl-2">
                {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div className="relative rounded-[2.5rem] overflow-hidden min-h-[20rem] flex flex-col justify-center p-12 group shadow-xl">
                <img src="https://images.unsplash.com/photo-1601479860472-8800fb9d08e5?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000" alt="Background" />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/50"></div>
                <div className="relative z-10 w-full">
                  <h1 className="text-4xl md:text-5xl font-serif text-white/90 mb-2 leading-tight">
                    {getGreeting()}, <br/><span className="italic text-white">{formattedName}.</span>
                  </h1>
                  <div className="mt-6 flex items-center">
                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-md bg-white/10 border-white/20 shadow-lg">
                      <span className={`w-2.5 h-2.5 rounded-full ${phase.dot} shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-pulse`}></span>
                      <span className="text-xs font-bold tracking-widest uppercase text-white drop-shadow-md">{phase.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BIOMETRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { id: "energy", label: "Daily Energy", value: biometrics.energy, icon: "⚡️", bg: "bg-purple-50" },
                { id: "mood", label: "Current Mood", value: biometrics.mood, icon: "🧘‍♀️", bg: "bg-gray-100" },
                { id: "stress", label: "Stress Level", value: biometrics.stress, icon: "☁️", bg: "bg-blue-50" }
              ].map((stat) => (
                <div key={stat.id} onClick={() => setActiveModal(stat.id)} className={`p-6 rounded-3xl border shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group ${stat.value ? 'bg-purple-50/30 border-purple-100' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>{stat.icon}</div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                      {stat.value ? <p className="text-lg font-bold text-gray-900">{stat.value}</p> : <p className="text-sm font-medium text-purple-600 group-hover:text-purple-800 transition-colors">Log today's data →</p>}
                    </div>
                  </div>
                  {stat.value && <div className="text-purple-400">✓</div>}
                </div>
              ))}
            </div>

            {/* ACTION CARDS */}
            {isWorkoutComplete ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-[2.5rem] border border-emerald-100 shadow-sm flex flex-col md:flex-row items-center gap-8 p-10 hover:shadow-md transition-shadow">
                <div className="w-24 h-24 rounded-full bg-emerald-100/50 border border-emerald-200 flex items-center justify-center text-4xl flex-shrink-0">✅</div>
                <div className="flex-1 w-full text-center md:text-left">
                  <h4 className="text-3xl font-serif text-emerald-950 mb-2">Well done, {formattedName}.</h4>
                  <p className="text-emerald-700 font-medium text-lg leading-relaxed max-w-lg mb-6">You're done for the day! Enjoy your recovery. Consistency is how you build a stronger, more aligned body.</p>
                  <button onClick={onStartSavedWorkout} className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-emerald-700 transition-colors">
                    Workout More (Start Again) ↺
                  </button>
                </div>
              </div>
            ) : savedWorkout ? (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 p-6 hover:shadow-lg transition-shadow">
                <div className="w-full md:w-64 h-48 rounded-[1.5rem] overflow-hidden relative flex-shrink-0">
                  <img src={savedWorkout.image} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex-1 w-full">
                  <p className="text-[10px] font-bold tracking-widest text-purple-600 uppercase mb-2">Saved Plan • {savedWorkout.phase}</p>
                  <h4 className="text-2xl md:text-3xl font-serif text-gray-900 mb-1">{savedWorkout.title}</h4>
                  <div className="flex gap-4 mt-4 mb-6">
                    <span className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">⏱️ {savedWorkout.duration}</span>
                    <span className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">🏋️‍♀️ {savedWorkout.target}</span>
                  </div>
                  <button onClick={onStartSavedWorkout} className="bg-[#1C1C1E] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-black transition-colors">Start Workout →</button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-lg flex flex-col md:flex-row items-center group p-10 md:p-14">
                <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="max-w-lg">
                    <h3 className="text-3xl md:text-4xl font-serif text-white mb-3 leading-tight">{biometrics.energy && biometrics.mood && biometrics.stress ? "Your data is logged." : "Ready to move?"}</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">{biometrics.energy && biometrics.mood && biometrics.stress ? "Our engine is ready to synthesize your biometrics and cycle phase into today's optimal routine." : "Log your daily energy, mood, and stress levels above to unlock your phase-aligned workout for today."}</p>
                  </div>
                  <button onClick={onGenerateWorkout} disabled={!biometrics.energy || !biometrics.mood || !biometrics.stress} className="whitespace-nowrap bg-white text-gray-900 px-8 py-4 rounded-full font-bold shadow-xl hover:bg-purple-50 transition-all disabled:opacity-30 flex items-center gap-2">Generate Today's Plan →</button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* COMPONENT ROUTING */}
        {activeTab === "my_plan" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto w-full pt-4">
            <h2 className="text-4xl font-serif text-gray-900 mb-8">Your Protocol</h2>
            {savedWorkout ? (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col md:flex-row items-center gap-8 p-8">
                <div className="w-full md:w-1/3 h-64 rounded-[1.5rem] overflow-hidden relative flex-shrink-0">
                  <img src={savedWorkout.image || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop"} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex-1 w-full flex flex-col justify-center">
                  <p className="text-xs font-bold tracking-widest text-purple-600 uppercase mb-2">Active Plan</p>
                  <h3 className="text-3xl font-serif text-gray-900 mb-4">{savedWorkout.title}</h3>
                  <div className="flex gap-4 mb-8">
                    <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-medium text-gray-700">⏱️ {savedWorkout.duration}</span>
                    <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-medium text-gray-700">🏋️‍♀️ {savedWorkout.target}</span>
                  </div>
                  <button onClick={onStartSavedWorkout} className="bg-[#1C1C1E] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-black transition-colors self-start">
                    {isWorkoutComplete ? "Restart Workout ↺" : "Start Workout →"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border border-gray-100"><p className="text-gray-500 mb-4 text-lg">You haven't generated a plan for today.</p><button onClick={() => setActiveTab("home")} className="text-purple-600 font-bold hover:underline">Return Home to Generate</button></div>
            )}
          </motion.div>
        )}

        {activeTab === "cycle_insights" && <CycleInsights />}
        {activeTab === "workouts" && <VideoLibrary />}
        {activeTab === "progress" && <ProgressCharts />}
        {activeTab === "profile" && <Profile />}

        {/* MOBILE BOTTOM NAV (Hidden on Desktop) */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-around items-center px-2 py-4 z-50 pb-safe">
          <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-purple-700' : 'text-gray-400'}`}>
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>
          <button onClick={() => setActiveTab("my_plan")} className={`flex flex-col items-center gap-1 ${activeTab === 'my_plan' ? 'text-purple-700' : 'text-gray-400'}`}>
            <span className="text-xl">📋</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Plan</span>
          </button>
          <button onClick={() => setActiveTab("cycle_insights")} className={`flex flex-col items-center gap-1 ${activeTab === 'cycle_insights' ? 'text-purple-700' : 'text-gray-400'}`}>
            <span className="text-xl">🧬</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Insights</span>
          </button>
          <button onClick={() => setActiveTab("workouts")} className={`flex flex-col items-center gap-1 ${activeTab === 'workouts' ? 'text-purple-700' : 'text-gray-400'}`}>
            <span className="text-xl">▶️</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
          </button>
          <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-purple-700' : 'text-gray-400'}`}>
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
          </button>
        </nav>

      </main>

      {/* RIGHT PANEL & ANIMATED AVATAR */}
      <aside className="w-96 bg-[#FDFCFB] border-l border-gray-100 flex flex-col hidden xl:flex flex-shrink-0 z-40">
        
        {/* AVATAR HEADER */}
        <div className="px-8 py-8 flex justify-end items-center">
          <div className="relative">
            <div onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative w-10 h-10 rounded-full ring-2 ring-transparent group-hover:ring-purple-200 transition-all overflow-hidden bg-purple-100 flex items-center justify-center font-bold text-purple-700">
                {userData?.profile_picture ? (
                  <img src={userData.profile_picture} alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  formattedName.charAt(0)
                )}
              </div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors">{formattedName} ⌄</span>
            </div>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                  className="absolute top-14 right-0 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6"
                >
                  <div className="text-center mb-6 relative">
                    <div className="relative w-24 h-24 mx-auto mb-4 group">
                      <div className="w-full h-full rounded-full overflow-hidden bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-700 border-4 border-purple-50">
                        {userData?.profile_picture ? (
                          <img src={userData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          formattedName.charAt(0)
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full cursor-pointer hover:bg-black transition-colors shadow-lg border-2 border-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                    <h4 className="font-bold text-gray-900 text-xl mb-1">{formattedName}</h4>
                    <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Member since {userYear}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-2xl p-4 flex items-center justify-between border border-purple-100">
                    <span className="text-sm font-bold text-purple-900">Global Streak</span>
                    <span className="text-lg font-serif font-bold text-purple-600">🔥 {globalStreak} Days</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* STATIC CYCLE WIDGET */}
        <div className="flex-1 overflow-y-auto px-8 pb-10">
          <div className="mb-10">
            <h3 className="text-xl font-serif text-gray-900 mb-6">Your Cycle</h3>
            
            <div className="flex justify-between mb-6 text-center text-xs">
              {[...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 2 + i);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' }); 
                const dateNum = d.getDate();
                const isToday = i === 2; 

                // Determine the correct biological phase color for this specific calendar day
                const cycleOffset = i - 2; 
                let calcCycleDay = currentDay + cycleOffset;
                if (calcCycleDay <= 0) calcCycleDay = cycleLength + calcCycleDay;
                if (calcCycleDay > cycleLength) calcCycleDay = calcCycleDay % cycleLength;
                const dayPhase = getPhaseInfo(calcCycleDay);
                
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <span className="text-gray-400 font-medium">{dayName}</span>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold transition-all ${isToday ? (isWorkoutComplete ? 'bg-emerald-400 text-white shadow-md' : `${dayPhase.bg} ${dayPhase.color} shadow-sm`) : 'text-gray-700 hover:bg-gray-100 cursor-pointer'}`}>
                      {isToday && isWorkoutComplete ? "✓" : dateNum}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-gray-500">Day {currentDay} of {cycleLength}</span>
              <span className={`${phase.bg} ${phase.color} px-3 py-1 rounded-full`}>{phase.name}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
              <div className={`h-full ${phase.dot} rounded-full transition-all duration-1000`} style={{ width: `${(currentDay / cycleLength) * 100}%` }}></div>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Cycle Insights</p>
            <p className="text-sm text-gray-600 leading-relaxed pr-8">{phase.desc}</p>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden h-48 mb-8 shadow-sm group cursor-pointer">
             <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Ocean" />
             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
             <p className="absolute top-6 left-6 text-white font-serif italic text-xl leading-snug">
               A stronger <br/> more aligned you <br/> is always in progress.
             </p>
             <div className="absolute bottom-6 left-6 h-[1px] w-8 bg-white/60 group-hover:w-16 transition-all duration-300"></div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl z-10 p-8">
              <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors">✕</button>
              {renderModalContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}