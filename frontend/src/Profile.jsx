import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Profile() {
  const [formData, setFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            display_name: data.display_name || "",
            height_cm: data.height_cm || "",
            weight_kg: data.weight_kg || "",
            average_cycle_length: data.average_cycle_length || 28,
            sleep_hours: data.sleep_hours || 7,
            primary_goal: data.primary_goal || "Build Strength & Muscle"
          });
        }
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        display_name: formData.display_name,
        height_cm: Number(formData.height_cm),
        weight_kg: Number(formData.weight_kg),
        average_cycle_length: Number(formData.average_cycle_length),
        sleep_hours: Number(formData.sleep_hours),
        primary_goal: formData.primary_goal
      }, { merge: true });
      
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!formData) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto w-full pt-4 pb-12">
      <div className="mb-10">
        <h2 className="text-4xl font-serif text-gray-900 mb-2">Your Profile</h2>
        <p className="text-gray-500">Manage your biological metrics and training goals.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Display Name</label>
            <input type="text" value={formData.display_name} onChange={(e) => setFormData({...formData, display_name: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Primary Goal</label>
            <select value={formData.primary_goal} onChange={(e) => setFormData({...formData, primary_goal: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
              <option>Build Strength & Muscle</option>
              <option>Fat Loss & Endurance</option>
              <option>Hormonal Balance</option>
              <option>General Fitness & Energy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Height (cm)</label>
            <input type="number" value={formData.height_cm} onChange={(e) => setFormData({...formData, height_cm: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Weight (kg)</label>
            <input type="number" value={formData.weight_kg} onChange={(e) => setFormData({...formData, weight_kg: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Avg. Cycle Length</label>
            <input type="number" value={formData.average_cycle_length} onChange={(e) => setFormData({...formData, average_cycle_length: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-bold tracking-widest text-gray-400 uppercase mb-2">Avg. Sleep (Hours)</label>
            <input type="number" step="0.5" value={formData.sleep_hours} onChange={(e) => setFormData({...formData, sleep_hours: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" required />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-gray-100">
          <button type="submit" disabled={isSaving} className="bg-purple-600 text-white px-10 py-4 rounded-full font-bold shadow-md hover:bg-purple-700 transition-colors w-full sm:w-auto">
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          {message && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg">{message}</motion.span>}
        </div>
      </form>
    </motion.div>
  );
}