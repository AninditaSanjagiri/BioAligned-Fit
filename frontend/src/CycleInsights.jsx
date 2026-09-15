import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { auth, db } from "./firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export default function CycleInsights() {
  const [logs, setLogs] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const cycleDays = Array.from({ length: 28 }, (_, i) => i + 1);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      try {
        const userRef = auth.currentUser.uid;
        
        const logsQuery = query(collection(db, "users", userRef, "daily_logs"), orderBy("timestamp", "desc"), limit(30));
        const logsSnap = await getDocs(logsQuery);
        const fetchedLogs = logsSnap.docs.map(doc => doc.data());
        
        const sessionsQuery = query(collection(db, "users", userRef, "completed_sessions"), orderBy("date", "desc"), limit(30));
        const sessionsSnap = await getDocs(sessionsQuery);
        const fetchedSessions = sessionsSnap.docs.map(doc => doc.data());

        setLogs(fetchedLogs);
        setWorkouts(fetchedSessions);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getEnergyValue = (energyText) => {
    const map = { "Very Low": 1, "Low": 2, "Moderate": 3, "High": 4, "Very High": 5 };
    return map[energyText] || 3;
  };

  const getPhaseColor = (day) => {
    if (day <= 5) return "bg-red-100 border-red-200";       
    if (day <= 13) return "bg-purple-100 border-purple-200"; 
    if (day <= 16) return "bg-pink-100 border-pink-200";     
    return "bg-blue-100 border-blue-200";                    
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto w-full pt-4">
      
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-4xl font-serif text-gray-900 mb-2">Cycle Insights</h2>
          <p className="text-gray-500">Your energy and performance mapped across your 28-day rhythm.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 md:p-12 mb-8 relative overflow-hidden">
        
        <div className="absolute left-6 top-12 bottom-20 flex flex-col justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span>Peak</span>
          <span>Mod</span>
          <span>Low</span>
        </div>

        <div className="pl-12 h-64 flex items-end justify-between gap-1 md:gap-2 border-b border-gray-100 pb-4 relative z-10">
          {cycleDays.map((day, i) => {
            const logForDay = logs.find(l => l.calculated_cycle_day === day);
            const heightMultiplier = logForDay ? getEnergyValue(logForDay.energy) : (Math.sin((day / 28) * Math.PI) * 2.5 + 2); 
            const hasWorkout = workouts.some(w => w.date && new Date(w.date.toDate()).getDate() === new Date().getDate() - (28 - day));

            return (
              // FIX APPLIED HERE: Added h-full and justify-end
              <div key={day} className="flex flex-col items-center justify-end flex-1 group h-full">
                
                {/* FIX APPLIED HERE: Added flex-shrink-0 */}
                <div className={`w-2 h-2 flex-shrink-0 rounded-full mb-2 transition-all ${hasWorkout ? 'bg-purple-600 shadow-md' : 'bg-transparent'}`}></div>
                
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${heightMultiplier * 20}%` }}
                  transition={{ duration: 1, delay: i * 0.02, ease: "easeOut" }}
                  className={`w-full rounded-t-md border-t-2 ${getPhaseColor(day)} ${logForDay ? 'opacity-100' : 'opacity-40'} group-hover:opacity-100 transition-opacity relative`}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-3 rounded-lg whitespace-nowrap pointer-events-none transition-opacity z-20">
                    Day {day} {logForDay ? `• ${logForDay.energy}` : '• Projected'}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        <div className="pl-12 flex justify-between mt-4 text-xs font-bold tracking-widest uppercase">
          <div className="w-[18%] text-red-400 text-center">Menstrual</div>
          <div className="w-[28%] text-purple-400 text-center">Follicular</div>
          <div className="w-[11%] text-pink-400 text-center hidden md:block">Ovul.</div>
          <div className="w-[43%] text-blue-400 text-center">Luteal</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-50 rounded-[2rem] p-8 border border-purple-100 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">⚡️</div>
          <div>
            <h4 className="text-gray-900 font-bold mb-1">Follicular & Ovulatory</h4>
            <p className="text-gray-600 text-sm">Your energy peaks here. Focus on heavy lifting and PRs during these {Math.ceil(28 * (16/28))} days.</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-[2rem] p-8 border border-blue-100 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">🧘‍♀️</div>
          <div>
            <h4 className="text-gray-900 font-bold mb-1">Luteal & Menstrual</h4>
            <p className="text-gray-600 text-sm">Progesterone rises. Expect lower baseline energy and prioritize active recovery and volume.</p>
          </div>
        </div>
      </div>

    </motion.div>
  );
}