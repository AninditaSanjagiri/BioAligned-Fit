import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function BiometricsForm({ token, onLogout }) {
  const [formData, setFormData] = useState({
    phase: "Follicular",
    age: 28,
    estrogen: 150.0,
    pdg: 5.0,
    lh: 10.0,
    resting_heart_rate: 65,
    temperature_celsius: 36.5,
    overall_score: 85.0,
    stress_score: 20.0,
    fatigue: "Low"
  });

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Parse numbers for numeric fields, keep strings for dropdowns
      [name]: ["phase", "fatigue"].includes(name) ? value : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const response = await axios.post(
        `${API_BASE_URL}/predict`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setRecommendation(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Today's Biometrics</h1>
            <p className="text-gray-500 text-sm mt-1">Sync your workout to your cycle</p>
          </div>
          <button 
            onClick={onLogout}
            className="text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            Log Out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Phase</label>
              <select name="phase" value={formData.phase} onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none">
                <option>Menstrual</option>
                <option>Follicular</option>
                <option>Fertility</option>
                <option>Luteal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fatigue Level</label>
              <select name="fatigue" value={formData.fatigue} onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none">
                <option>Not at all</option>
                <option>Very Low/Little</option>
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
                <option>Very High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basal Body Temp (°C): {formData.temperature_celsius}</label>
              <input type="range" name="temperature_celsius" min="35" max="39" step="0.1" value={formData.temperature_celsius} onChange={handleChange} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resting Heart Rate: {formData.resting_heart_rate} bpm</label>
              <input type="range" name="resting_heart_rate" min="40" max="120" value={formData.resting_heart_rate} onChange={handleChange} className="w-full accent-purple-500" />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estrogen (pg/mL): {formData.estrogen}</label>
              <input type="range" name="estrogen" min="0" max="400" value={formData.estrogen} onChange={handleChange} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PdG (ug/mL): {formData.pdg}</label>
              <input type="range" name="pdg" min="0" max="30" value={formData.pdg} onChange={handleChange} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overall Readiness: {formData.overall_score}</label>
              <input type="range" name="overall_score" min="0" max="100" value={formData.overall_score} onChange={handleChange} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stress Score: {formData.stress_score}</label>
              <input type="range" name="stress_score" min="0" max="100" value={formData.stress_score} onChange={handleChange} className="w-full accent-purple-500" />
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-semibold py-4 rounded-xl shadow-md hover:bg-purple-700 transition-colors disabled:opacity-70">
              {loading ? "Analyzing Biometrics & Consulting Gemini..." : "Generate Custom Routine"}
            </button>
          </div>
        </form>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>}

        {recommendation && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-purple-100"
          >
            <div className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
              Intensity Target: {recommendation.intensity_label}
            </div>
            <div className="prose prose-purple max-w-none">
                <ReactMarkdown>
                    {recommendation.gemini_generated_routine}
                </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}