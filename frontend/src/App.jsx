import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

import LandingPage from "./LandingPage";
import Login from "./Login";
import OnboardingWizard from "./OnboardingWizard";
import Dashboard from "./Dashboard";
import WorkoutGenerator from "./WorkoutGenerator"; 
import ActiveWorkout from "./ActiveWorkout";

export default function App() {
  const [activeRoutine, setActiveRoutine] = useState("");
  const [currentScreen, setCurrentScreen] = useState("landing"); 
  const [authToken, setAuthToken] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [biometrics, setBiometrics] = useState({ energy: null, mood: null, stress: null });
  const [savedWorkout, setSavedWorkout] = useState(null);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const token = await user.getIdToken();
          setAuthToken(token);
          
          // 1. Fetch today's biometrics so they survive a page refresh
          const todayUtc = new Date().toISOString().substring(0, 10); 
          const logRef = doc(db, "users", user.uid, "daily_logs", todayUtc);
          const logSnap = await getDoc(logRef);
          if (logSnap.exists()) {
            const logData = logSnap.data();
            setBiometrics({ energy: logData.energy, mood: logData.mood, stress: logData.stress });
          }

          // 2. Fetch main user profile
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.last_period_start || userData.lastPeriod || userData.username || userData.displayName) {
              
              // 3. MIDNIGHT EXPIRATION: Only load the saved workout if it was generated TODAY
              if (userData.todays_workout && userData.todays_workout.saved_at) {
                const savedDate = new Date(userData.todays_workout.saved_at);
                if (savedDate.toDateString() === new Date().toDateString()) {
                  setSavedWorkout(userData.todays_workout);
                }
              }
              
              setCurrentScreen("app");
            } else {
              setCurrentScreen("onboarding");
            }
          } else {
            setCurrentScreen("onboarding");
          }
        } else {
          setAuthToken(null);
          setCurrentScreen("landing");
        }
      } catch (error) {
        console.error("Firebase Error:", error);
        setCurrentScreen("landing"); 
      } finally {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogin = async (token) => {
    setIsCheckingAuth(true);
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.last_period_start || userData.lastPeriod || userData.username || userData.displayName) {
          setCurrentScreen("app");
        } else {
          setCurrentScreen("onboarding");
        }
      } else {
        setCurrentScreen("onboarding");
      }
    }
    setIsCheckingAuth(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setBiometrics({ energy: null, mood: null, stress: null });
    setSavedWorkout(null);
    setIsWorkoutComplete(false);
  };

  if (currentScreen === "landing") return <LandingPage onGetStarted={() => setCurrentScreen("login")} />;
  if (currentScreen === "login") return <Login onLogin={handleLogin} />;
  if (currentScreen === "onboarding") return <OnboardingWizard onComplete={() => setCurrentScreen("app")} />;

  if (currentScreen === "active_workout") {
    return (
      <ActiveWorkout 
        routine={activeRoutine} 
        onEndWorkout={async (completedDuration) => { 
          if (auth.currentUser && savedWorkout) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            
            // Accumulate duration if restarting a workout on the same day
            let previousDuration = 0;
            if (userSnap.exists()) {
                const data = userSnap.data();
                if (data.last_workout_date && data.last_workout_duration_seconds) {
                    const lastDate = typeof data.last_workout_date.toDate === 'function' ? data.last_workout_date.toDate() : new Date(data.last_workout_date);
                    if (lastDate.toDateString() === new Date().toDateString()) {
                        previousDuration = data.last_workout_duration_seconds;
                    }
                }
            }

            await setDoc(userRef, {
              last_workout_target: savedWorkout.target || "Adaptive Split",
              last_workout_date: serverTimestamp(),
              last_workout_duration_seconds: previousDuration + (completedDuration || 0)
            }, { merge: true });

            // Push a permanent record to the completed history for the charts
            await addDoc(collection(db, "users", auth.currentUser.uid, "completed_sessions"), {
              date: serverTimestamp(),
              duration: completedDuration || 0,
              target: savedWorkout.target || "Adaptive Split"
            });
          }

          setIsWorkoutComplete(true); 
          setCurrentScreen("app");
        }} 
      />
    );
  }

  if (currentScreen === "workout_generator") {
    return (
      <WorkoutGenerator 
        biometrics={biometrics} 
        onBack={() => setCurrentScreen("app")} 
        onStart={(markdown) => {
          setActiveRoutine(markdown); 
          setCurrentScreen("active_workout"); 
        }}
        onSave={async (markdown) => {
          const workoutData = {
            title: "Aligned Daily Routine", 
            phase: "Current Phase", 
            duration: "45 mins", 
            target: "Adaptive Split",
            image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop",
            raw_markdown: markdown,
            saved_at: Date.now() // <--- This timestamp forces the midnight expiration!
          };
          
          setSavedWorkout(workoutData); 
          
          if (auth.currentUser) {
            await setDoc(doc(db, "users", auth.currentUser.uid), {
              todays_workout: workoutData
            }, { merge: true });
          }

          setCurrentScreen("app");
        }}
      />
    );
  }

  return (
    <Dashboard 
      onLogout={handleLogout} 
      onGenerateWorkout={() => setCurrentScreen("workout_generator")} 
      onStartSavedWorkout={() => {
        setActiveRoutine(savedWorkout.raw_markdown); 
        setCurrentScreen("active_workout");          
      }}
      biometrics={biometrics}       
      setBiometrics={setBiometrics} 
      savedWorkout={savedWorkout}
      isWorkoutComplete={isWorkoutComplete} 
    />
  );
}