import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export default function WorkoutGenerator({ onBack, onStart, onSave, biometrics }) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [workoutMeta, setWorkoutMeta] = useState({ phase: "Calculating...", target: "Adaptive Split" });

  useEffect(() => {
    const generateWorkout = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("You must be logged in to generate a workout.");

        // 1. Fetch User Data to calculate real-time Phase & Day
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        // Define variables globally for the function to use
        let calculatedPhase = "Follicular Phase";
        let currentDay = 1;
        let lastWorkoutTarget = "None"; // <--- Added this globally

        if (docSnap.exists()) {
          const userData = docSnap.data();
          lastWorkoutTarget = userData.last_workout_target || "None"; // <--- Capture history safely
          
          const cycleLength = userData.average_cycle_length || 28;
          if (userData.last_period_start) {
            const diffTime = Math.abs(new Date() - userData.last_period_start.toDate());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            currentDay = (diffDays % cycleLength) + 1;
            
            const scale = cycleLength / 28.0;
            if (currentDay <= Math.ceil(5 * scale)) calculatedPhase = "Menstrual Phase";
            else if (currentDay <= Math.ceil(13 * scale)) calculatedPhase = "Follicular Phase";
            else if (currentDay <= Math.ceil(16 * scale)) calculatedPhase = "Ovulatory Phase";
            else calculatedPhase = "Luteal Phase";
          }
        }

        setWorkoutMeta(prev => ({ ...prev, phase: calculatedPhase }));
        const token = await user.getIdToken();

        // 2. Call FastAPI with the exact payload
        const response = await fetch("http://localhost:8000/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          },
          body: JSON.stringify({
            energy: biometrics?.energy || "Moderate", 
            mood: biometrics?.mood || "Positive",
            stress: biometrics?.stress || "Moderate",
            phase: calculatedPhase,
            current_day: currentDay,
            last_workout: lastWorkoutTarget // <--- Now it safely reads the scoped variable!
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "API Validation Error");
        }

        const data = await response.json();
        
        // Safely extract the Gemini markdown
        const markdown = data.gemini_generated_routine || data.routine || "No routine was returned by the AI.";
        
        setGeneratedPlan(markdown);
        setIsGenerating(false);

      } catch (error) {
        console.error("Error generating workout:", error);
        setGeneratedPlan(`### Workout Generation Failed\n\n**Error:** ${error.message}\n\nPlease ensure your FastAPI Python server is running and your payload matches your Pydantic schema.`);
        setIsGenerating(false);
      }
    };

    generateWorkout();
  }, [biometrics]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-gray-900 flex flex-col">
      <nav className="fixed top-0 w-full bg-[#FDFCFB]/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="flex items-center justify-between px-8 py-4 max-w-5xl mx-auto w-full">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <span className="text-lg">←</span> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <span className="text-purple-600 text-xl">🌿</span>
            <span className="text-lg font-bold tracking-tight">BioAligned-Fit</span>
          </div>
          <div className="w-24"></div> 
        </div>
      </nav>

      <main className="flex-grow pt-24 pb-20 px-6 sm:px-12 flex items-center justify-center max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div key="loading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center text-center space-y-8 max-w-md">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
              </div>
              <div>
                <h2 className="text-2xl font-serif text-gray-900 mb-2">Synthesizing Data...</h2>
                <p className="text-gray-500 leading-relaxed">Cross-referencing your cycle metrics with your daily energy and stress levels.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              
              {/* HEADER WITH DYNAMIC PILL BADGES */}
              <div className="text-center mb-12">
                <p className="text-xs font-bold tracking-widest text-purple-600 uppercase mb-3">AI-Generated Protocol</p>
                <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6">Today's Aligned Workout</h1>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-gray-500">
                  <span className="bg-white px-5 py-2.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">⏱️ 45 mins</span>
                  <span className="bg-white px-5 py-2.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">🏋️‍♀️ {workoutMeta.target}</span>
                  <span className="bg-purple-50 text-purple-700 font-bold px-5 py-2.5 rounded-full border border-purple-100 shadow-sm flex items-center gap-2">🌿 {workoutMeta.phase}</span>
                </div>
              </div>

              {/* RENDERED MARKDOWN BOX */}
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 mb-10 min-h-[400px]">
                <ReactMarkdown 
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-2xl font-serif font-bold text-gray-900 mt-10 mb-4 border-b border-gray-100 pb-3" {...props} />,
                    p: ({node, ...props}) => <p className="text-gray-600 leading-relaxed mb-4 text-[16px]" {...props} />,
                    ul: ({node, ...props}) => <ul className="space-y-4 mb-8" {...props} />,
                    li: ({node, ...props}) => (
                      <li className="flex items-start gap-3 text-gray-700 text-[16px] bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span className="text-purple-500 mt-1 flex-shrink-0">●</span>
                        <span {...props} />
                      </li>
                    ),
                    strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-10 border-gray-200 border-dashed" {...props} />
                  }}
                >
                  {generatedPlan}
                </ReactMarkdown>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <button 
                  onClick={() => onStart(generatedPlan)} 
                  className="w-full sm:w-auto bg-[#1C1C1E] text-white px-12 py-4 rounded-full font-bold shadow-xl hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  Start Workout →
                </button>
                <button 
                  onClick={() => onSave(generatedPlan)} // <--- Fix 1: Pass the text to the save function
                  className="w-full sm:w-auto px-8 py-4 rounded-full font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  Save to My Plan
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}