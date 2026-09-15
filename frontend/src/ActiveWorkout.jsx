import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function ActiveWorkout({ onEndWorkout, routine }) {
  const [restTimeLeft, setRestTimeLeft] = useState(null); 
  const [showVictory, setShowVictory] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);

  // NEW: Stepper State
  const [exercisesList, setExercisesList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Parse Markdown into Steps
  useEffect(() => {
    if (routine) {
      const lines = routine.split('\n');
      const parsed = [];
      let currentPhase = "Warm Up";
      
      lines.forEach(line => {
        if (line.startsWith('###')) {
          currentPhase = line.replace(/###|\*/g, '').trim();
        } else if (line.trim().startsWith('*')) {
          parsed.push({
            phase: currentPhase,
            text: line.replace(/\*/g, '').trim()
          });
        }
      });
      
      if (parsed.length === 0) {
        parsed.push({ phase: "Free Form", text: "Follow the routine on the left pane." });
      }
      setExercisesList(parsed);
    }
  }, [routine]);

  // 1. Total Workout Stopwatch
  useEffect(() => {
    const interval = setInterval(() => setTotalSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 2. Audio Beeps
  const playBeep = useCallback((frequency, type, duration) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }, []);

  const playVictorySequence = useCallback(() => {
    playBeep(523.25, 'sine', 0.2); 
    setTimeout(() => playBeep(659.25, 'sine', 0.2), 200); 
    setTimeout(() => playBeep(783.99, 'sine', 0.4), 400); 
    setTimeout(() => playBeep(1046.50, 'sine', 0.6), 600); 
  }, [playBeep]);

  // 3. Rest Timer Countdown Logic
  useEffect(() => {
    let interval;
    if (restTimeLeft !== null && restTimeLeft > 0) {
      interval = setInterval(() => setRestTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [restTimeLeft]);

  // 4. Audio Trigger Logic
  useEffect(() => {
    if (restTimeLeft !== null) {
      if (restTimeLeft <= 5 && restTimeLeft > 0) playBeep(440, 'sine', 0.15); 
      else if (restTimeLeft === 0) {
        playBeep(880, 'square', 0.5); 
        setRestTimeLeft(null); 
      }
    }
  }, [restTimeLeft, playBeep]);

  const handleCompleteWorkout = () => {
    setShowConfirmExit(false);
    setShowVictory(true);
    playVictorySequence();
    setTimeout(() => {
      onEndWorkout(totalSeconds); 
    }, 3500);
  };

  const handleNextStep = () => {
    if (currentIndex < exercisesList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Auto-trigger 60s rest unless it's just a warm-up sequence
      if (!exercisesList[currentIndex].phase.toLowerCase().includes("warm")) {
        setRestTimeLeft(60); 
      }
    } else {
      setShowConfirmExit(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#111112] font-sans text-white flex flex-col relative overflow-hidden">
      
      <header className="fixed top-0 w-full bg-[#111112]/90 backdrop-blur-md flex justify-between items-center p-6 z-20 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold tracking-widest text-gray-400">FOCUS MODE</span>
        </div>
        <div className="text-2xl font-serif font-bold text-purple-400 tabular-nums">
          {formatTime(totalSeconds)}
        </div>
      </header>

      {/* SPLIT SCREEN MAIN AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 pt-28 pb-32 flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* LEFT PANE: FULL MARKDOWN PLAN */}
        <div className="flex-1 bg-white/5 backdrop-blur-sm border border-gray-800 rounded-[2.5rem] p-8 overflow-y-auto max-h-[75vh]">
          <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-6 border-b border-gray-800 pb-4">Full Protocol</p>
          <ReactMarkdown 
            components={{
              h3: ({node, ...props}) => <h3 className="text-xl font-serif font-bold text-gray-200 mt-8 mb-4" {...props} />,
              p: ({node, ...props}) => <p className="text-gray-400 leading-relaxed mb-4 text-[15px]" {...props} />,
              ul: ({node, ...props}) => <ul className="space-y-3 mb-6" {...props} />,
              li: ({node, ...props}) => (
                <li className="flex items-start gap-3 text-gray-300 text-[15px] bg-gray-900/50 p-3 rounded-xl">
                  <span className="text-purple-500 mt-1 flex-shrink-0">●</span><span {...props} />
                </li>
              ),
              strong: ({node, ...props}) => <strong className="font-bold text-gray-100" {...props} />
            }}
          >
            {routine || "No routine loaded."}
          </ReactMarkdown>
        </div>

        {/* RIGHT PANE: ACTIVE STEPPER & REST TIMER */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/10 blur-[100px] rounded-full pointer-events-none"></div>

          <AnimatePresence mode="wait">
            {restTimeLeft === null ? (
              <motion.div key="exercise" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full">
                <p className="text-purple-400 font-bold tracking-widest uppercase mb-4 text-sm">
                  {exercisesList[currentIndex]?.phase || "Loading..."}
                </p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-12 leading-tight">
                  {exercisesList[currentIndex]?.text || "Preparing your movements..."}
                </h2>
                
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-6 py-3 rounded-full font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handleNextStep}
                    className="px-8 py-3 rounded-full font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    {currentIndex === exercisesList.length - 1 ? "Finish Workout" : "Next Set →"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="resting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="w-full">
                <h2 className="text-xl text-gray-400 font-serif mb-6 uppercase tracking-widest">Rest & Recover</h2>
                <div className="text-[10rem] font-bold text-purple-400 leading-none mb-8 tabular-nums">{restTimeLeft}</div>
                <button onClick={() => setRestTimeLeft(null)} className="px-8 py-3 rounded-full font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                  Skip Rest ⏭
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* STICKY BOTTOM BAR */}
      <footer className="fixed bottom-0 w-full bg-[#111112]/90 backdrop-blur-md border-t border-gray-800 p-6 flex flex-wrap items-center justify-center gap-4 z-20">
        <span className="text-gray-500 text-sm font-bold tracking-widest uppercase mr-2 hidden sm:inline-block">Quick Rest:</span>
        <button onClick={() => setRestTimeLeft(30)} className="px-6 py-2 rounded-full font-bold text-sm bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors">30s</button>
        <button onClick={() => setRestTimeLeft(60)} className="px-6 py-2 rounded-full font-bold text-sm bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors">60s</button>
        <div className="w-px h-6 bg-gray-800 mx-2 hidden sm:block"></div>
        <button onClick={() => setShowConfirmExit(true)} className="px-8 py-2 rounded-full font-bold text-sm bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">End Session</button>
      </footer>

      {/* CONFIRMATION MODAL TO PREVENT ACCIDENTAL CLOSING */}
      <AnimatePresence>
        {showConfirmExit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] max-w-sm w-full text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-2xl font-serif text-white mb-2">Finish Workout?</h3>
              <p className="text-gray-400 mb-8">Are you sure you want to end this session and log your time?</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleCompleteWorkout} className="w-full py-4 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-500 transition-colors">Yes, I'm Done</button>
                <button onClick={() => setShowConfirmExit(false)} className="w-full py-4 rounded-xl font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">Resume Workout</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VICTORY OVERLAY */}
      <AnimatePresence>
        {showVictory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-[#111112]/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="text-center z-10">
              <div className="text-8xl mb-6">🏆</div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-4">Workout Complete!</h1>
              <p className="text-2xl text-purple-400">Time logged successfully.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}