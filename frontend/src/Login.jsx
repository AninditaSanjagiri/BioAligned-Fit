import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "./firebase";
import { 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";

export default function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false); // Toggles between Login and Register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handles both Logging In and Creating an Account
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      let result;
      if (isSignUp) {
        // Create new user
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Log in existing user
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      
      const token = await result.user.getIdToken();
      onLogin(token);
    } catch (err) {
      console.error("Email auth error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(`Failed to ${isSignUp ? 'create account' : 'sign in'}. Please check your credentials.`);
      }
      setIsLoading(false);
    }
  };

  // Handles both Google and GitHub
  const handleSocialLogin = async (providerType) => {
    setIsLoading(true);
    setError("");
    
    try {
      let provider;
      if (providerType === 'google') {
        provider = new GoogleAuthProvider();
      } else if (providerType === 'github') {
        provider = new GithubAuthProvider();
      }

      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      onLogin(token);
    } catch (err) {
      console.error(`${providerType} login error:`, err);
      // Handles case where user tries to log in with GitHub but already used that email for Google
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError("An account already exists with the same email but a different sign-in method.");
      } else {
        setError(`Failed to sign in with ${providerType}. Please try again.`);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans text-gray-900 bg-white">
      
      {/* Left Panel: Lifestyle Image & Copy */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1974&auto=format&fit=crop" 
          alt="Gym equipment" 
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-between w-full p-16">
          <div className="text-white/80 font-serif text-3xl italic tracking-wide mt-12">
            A stronger, <br />
            more aligned you <br />
            is a login away ♡
          </div>
          
          <div className="text-white/90 text-xl font-medium tracking-wide">
            "Your body isn't complicated. <br />
            <span className="text-purple-300">It's communicating."</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Authentication Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 lg:p-16 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={isSignUp ? "signup" : "signin"}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            className="w-full max-w-md space-y-8"
          >
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-purple-600 text-3xl">🌿</span>
                <span className="text-2xl font-bold tracking-tight">BioAligned-Fit</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isSignUp ? "Create your account" : "Sign in to your account"}
              </h2>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 mt-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input 
                    type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input 
                    type="password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 accent-purple-600" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-500">Forgot password?</a>
                </div>
              )}

              <button 
                type="submit" disabled={isLoading}
                className="w-full bg-purple-700 text-white font-medium py-3 rounded-xl shadow-sm hover:bg-purple-800 transition-colors flex justify-center items-center h-12"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (isSignUp ? "Sign Up" : "Sign In")}
              </button>
            </form>

            {/* Social Logins */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <button 
                  type="button" 
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  <span className="text-sm font-medium text-gray-700">Google</span>
                </button>
                
                <button 
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">GitHub</span>
                </button>
              </div>

            {/* Toggle State Button */}
            <p className="text-center text-sm text-gray-600 mt-8">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button 
                type="button" 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(""); // Clear errors on toggle
                }} 
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                {isSignUp ? "Sign in" : "Create one"}
              </button>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}