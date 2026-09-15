import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { auth, db } from "./firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function ProgressCharts() {
  const [stats, setStats] = useState({
    currentStreak: 0,
    highestStreak: 0,
    totalSessions: 0,
    months: ["", "", "", "", "", ""],
    workoutCounts: [0, 0, 0, 0, 0, 0]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!auth.currentUser) return;

      try {
        // Point to completed_sessions instead of workouts
        const sessionsRef = collection(db, "users", auth.currentUser.uid, "completed_sessions");
        const q = query(sessionsRef, orderBy("date", "asc"));
        const snapshot = await getDocs(q);

        const workoutDates = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.date) {
            workoutDates.push(data.date.toDate());
          }
        });
        
        const totalSessions = workoutDates.length;

        // 1. Calculate Streaks
        let currentStreak = 0;
        let highestStreak = 0;
        let current = 0;

        if (workoutDates.length > 0) {
          // Normalize dates to midnight to easily count consecutive days
          const uniqueDates = [...new Set(workoutDates.map(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          }))];

          if (uniqueDates.length > 0) {
            current = 1;
            highestStreak = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
              const diffDays = (uniqueDates[i] - uniqueDates[i - 1]) / (1000 * 60 * 60 * 24);
              if (diffDays === 1) {
                current++;
                highestStreak = Math.max(highestStreak, current);
              } else {
                current = 1; // reset streak
              }
            }
            
            // Check if current streak is still active (they worked out today or yesterday)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastWorkoutDate = uniqueDates[uniqueDates.length - 1];
            const diffFromToday = (today.getTime() - lastWorkoutDate) / (1000 * 60 * 60 * 24);
            
            currentStreak = diffFromToday <= 1 ? current : 0;
          }
        }

        // 2. Calculate Monthly Volume (Last 6 Months)
        const monthMap = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthKey = d.toLocaleString('default', { month: 'short' }).toUpperCase();
          monthMap[monthKey] = 0;
        }

        workoutDates.forEach(date => {
          const monthKey = date.toLocaleString('default', { month: 'short' }).toUpperCase();
          if (monthMap[monthKey] !== undefined) {
            monthMap[monthKey]++;
          }
        });

        setStats({
          currentStreak,
          highestStreak,
          totalSessions,
          months: Object.keys(monthMap),
          workoutCounts: Object.values(monthMap)
        });

      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  // Growth Calculation for the Badge
  const currentMonthCount = stats.workoutCounts[5] || 0;
  const lastMonthCount = stats.workoutCounts[4] || 0;
  let growthString = "0%";
  if (lastMonthCount > 0) {
    const percent = Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
    growthString = percent > 0 ? `+${percent}%` : `${percent}%`;
  } else if (currentMonthCount > 0) {
    growthString = "+100%";
  }

  // Dynamic SVG Chart Calculations
  // Ensure maxVal is at least 1 so we don't divide by zero if the user has no workouts
  const maxVal = Math.max(...stats.workoutCounts, 1); 
  const chartWidth = 800;
  const chartHeight = 200;
  
  const points = stats.workoutCounts.map((val, i) => {
    const x = (i / (stats.workoutCounts.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * (chartHeight - 40); 
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

  if (isLoading) {
    return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto w-full pt-4 pb-12">
      
      <div className="mb-10">
        <h2 className="text-4xl font-serif text-gray-900 mb-2">Your Progress</h2>
        <p className="text-gray-500">Tracking your consistency and hormonal alignment over time.</p>
      </div>

      {/* STREAK CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-4xl mb-4">🔥</span>
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Current Streak</p>
          <p className="text-4xl font-serif text-gray-900">{stats.currentStreak} Days</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-[2rem] p-8 border border-purple-100 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-200/50 rounded-full blur-2xl"></div>
          <span className="text-4xl mb-4 relative z-10">🏆</span>
          <p className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-1 relative z-10">Highest Streak</p>
          <p className="text-4xl font-serif text-purple-900 relative z-10">{stats.highestStreak} Days</p>
        </div>
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-4xl mb-4">📈</span>
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Total Sessions</p>
          <p className="text-4xl font-serif text-gray-900">{stats.totalSessions}</p>
        </div>
      </div>

      {/* SVG LINE CHART */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 md:p-12 relative">
        <div className="flex justify-between items-center mb-12">
          <h3 className="text-xl font-bold text-gray-900">Monthly Volume</h3>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${growthString.startsWith('+') ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {growthString} vs Last Month
          </span>
        </div>

        <div className="w-full overflow-x-auto pb-4">
          <div className="min-w-[600px] relative">
            
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-full h-px bg-gray-100"></div>
              ))}
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible relative z-10">
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(147, 51, 234, 0.2)" />
                  <stop offset="100%" stopColor="rgba(147, 51, 234, 0)" />
                </linearGradient>
              </defs>
              <motion.path 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
                d={areaPath} fill="url(#purpleGradient)" 
              />
              <motion.path 
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
                d={linePath} fill="none" stroke="#9333EA" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
              />

              {stats.workoutCounts.map((val, i) => {
                const x = (i / (stats.workoutCounts.length - 1)) * chartWidth;
                const y = chartHeight - (val / maxVal) * (chartHeight - 40);
                return (
                  <motion.circle 
                    key={i}
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1 + (i * 0.1) }}
                    cx={x} cy={y} r="6" fill="#fff" stroke="#9333EA" strokeWidth="3" 
                  />
                );
              })}
            </svg>

            <div className="flex justify-between mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
              {stats.months.map((m, i) => <span key={i}>{m}</span>)}
            </div>

          </div>
        </div>
      </div>

    </motion.div>
  );
}