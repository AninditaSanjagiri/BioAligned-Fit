import { motion } from "framer-motion";

export default function LandingPage({ onGetStarted }) {
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    {
      title: "Dynamic Cycle Syncing",
      description: "Your hormonal landscape changes daily. Our algorithms map your exact phase—Menstrual, Follicular, Ovulatory, or Luteal—to recommend the precise training stimulus your body is primed for.",
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      )
    },
    {
      title: "Science-Backed AI",
      description: "Powered by a sophisticated Random Forest machine learning model and Google's Gemini AI, every routine is cross-referenced with your basal body temperature, resting heart rate, and fatigue levels.",
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M5.25 12h13.5m-13.5 3.75h13.5m-13.5 3.75h13.5M15.75 3v1.5m-7.5 15v1.5m7.5-1.5v1.5M12 9.75v-1.5m0 1.5c-1.242 0-2.25 1.008-2.25 2.25s1.008 2.25 2.25 2.25 2.25-1.008 2.25-2.25-1.008-2.25-2.25-2.25Z" />
        </svg>
      )
    },
    {
      title: "Precision Progress Tracking",
      description: "Move beyond standard calorie counting. Track how your estrogen and progesterone ratios correlate with your strength gains, recovery times, and overall readiness scores.",
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
      )
    },
    {
      title: "Adaptive Intensity",
      description: "Some days call for heavy resistance training; others require parasympathetic reset and deep mobility. BioAligned-Fit automatically scales your volume and intensity to prevent CNS burnout.",
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-[#FDFDFD]/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="text-purple-600 text-2xl">🌿</span>
            <span className="text-xl font-bold tracking-tight">BioAligned-Fit</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#home" className="hover:text-purple-600 transition">Home</a>
            <a href="#how-it-works" className="hover:text-purple-600 transition">How It Works</a>
            <a href="#features" className="hover:text-purple-600 transition">Features</a>
            <a href="#about" className="hover:text-purple-600 transition">About</a>
          </div>
          <button 
            onClick={onGetStarted}
            className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main id="home" className="pt-32 pb-12 flex items-center max-w-7xl mx-auto w-full px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            className="max-w-lg space-y-6"
          >
            <motion.p variants={fadeUp} className="text-purple-600 font-semibold tracking-wider text-sm uppercase">
              Your Cycle. Your Strength.
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-serif text-gray-900 leading-[1.1]">
              Sync Your Cycle. <br/> Transform Your Training.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-gray-600 leading-relaxed">
              Personalized, cycle-aware workout recommendations powered by science and machine learning.
            </motion.p>
            <motion.div variants={fadeUp} className="pt-4">
              <button 
                onClick={onGetStarted}
                className="bg-purple-700 hover:bg-purple-800 text-white px-8 py-4 rounded-full font-medium transition-all shadow-lg flex items-center gap-3"
              >
                Start Your Journey <span className="text-xl">→</span>
              </button>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-4 pt-6">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white overflow-hidden"><img src="https://i.pravatar.cc/100?img=1" alt="user" /></div>
                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white overflow-hidden"><img src="https://i.pravatar.cc/100?img=5" alt="user" /></div>
                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white overflow-hidden"><img src="https://i.pravatar.cc/100?img=9" alt="user" /></div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Join a growing community training in sync.</p>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop" alt="Woman training" className="absolute inset-0 w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-8 right-8 text-white font-serif text-3xl text-right leading-tight drop-shadow-md">
              Stronger <br/><span className="italic">Every Phase</span> ♡
            </div>
          </motion.div>
        </div>
      </main>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-purple-50/50">
        <div className="max-w-7xl mx-auto px-8 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-gray-900 mb-4">How BioAligned-Fit Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Three simple steps to harmonize your fitness routine with your biological rhythm.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Log Your Biometrics", desc: "Input your cycle phase, energy levels, and basal body temp." },
              { step: "02", title: "AI Analysis", desc: "Our machine learning model calculates your optimal exertion levels." },
              { step: "03", title: "Train Smart", desc: "Receive a custom Gemini-generated workout tailored exactly to your body today." }
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <span className="text-4xl font-serif text-purple-200 mb-4 block">{item.step}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: Elevated Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 w-full">
          <div className="text-center mb-20">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-purple-600 font-semibold tracking-wider text-sm uppercase mb-3">
              The Architecture
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-serif text-gray-900">
              Engineered for Female Physiology
            </motion.h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            {features.map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} 
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: Expanded About Section */}
      <section id="about" className="py-24 bg-[#0A0A0A] text-white">
        <div className="max-w-7xl mx-auto px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            {/* Left: Copy */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-serif leading-tight">
                Women's bodies aren't <br/><span className="text-purple-400 italic">small men's bodies.</span>
              </h2>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  For decades, standard fitness programming has ignored the reality of the female hormonal cycle. Our energy shifts, our core temperatures fluctuate, and our recovery capabilities change dynamically across a 28-day rhythm. 
                </p>
                <p>
                  We built BioAligned-Fit to bridge the gap between female physiology and strength training. By combining advanced predictive AI with real-time biometric data, we ensure that you are no longer fighting your body—you are finally working with it.
                </p>
              </div>
              <div className="pt-4">
                <button onClick={onGetStarted} className="bg-white text-gray-900 px-8 py-3.5 rounded-full font-medium hover:bg-purple-50 transition-colors shadow-lg shadow-white/10">
                  Join the Movement
                </button>
              </div>
            </motion.div>

            {/* Right: Editorial Image */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="relative h-[500px] w-full rounded-[2rem] overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop" 
                alt="Woman resting at gym" 
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 to-transparent mix-blend-multiply"></div>
            </motion.div>

          </div>
        </div>
      </section>
      
    </div>
  );
}