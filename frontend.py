# frontend.py
import streamlit as st
import requests
import json

st.set_page_config(page_title="BioAligned Fit", page_icon="💪", layout="centered")

st.title("💪 BioAligned Fit")
st.subheader("Cycle-Aware Workout Recommendation")

st.markdown("### Enter your health details:")

# Cycle phase selection
cycle_phase = st.selectbox("Cycle Phase", ["Menstrual", "Follicular", "Ovulatory", "Luteal"])

# Hormone estimation (approx values by phase)
phase_defaults = {
    "Menstrual": {"Estrogen_Level": 20, "Progesterone_Level": 10},
    "Follicular": {"Estrogen_Level": 70, "Progesterone_Level": 15},
    "Ovulatory": {"Estrogen_Level": 90, "Progesterone_Level": 20},
    "Luteal": {"Estrogen_Level": 60, "Progesterone_Level": 80},
}

# Default hormone values auto-set
default_estrogen = phase_defaults[cycle_phase]["Estrogen_Level"]
default_progesterone = phase_defaults[cycle_phase]["Progesterone_Level"]

estrogen = st.slider("Estimated Estrogen Level", 10, 100, default_estrogen)
progesterone = st.slider("Estimated Progesterone Level", 10, 100, default_progesterone)
st.caption("Hormone levels are estimated based on your selected menstrual phase.")

# Lifestyle-based fatigue estimation
st.markdown("### 🛌 Lifestyle Factors (for fatigue estimation)")

sleep_hours = st.slider("Hours of Sleep (last night)", 3, 10, 7)
stress_level = st.slider("Stress Level (0 = relaxed, 10 = very stressed)", 0, 10, 5)
worked_out_yesterday = st.selectbox("Did you work out yesterday?", ["Yes", "No"])

# Calculate fatigue using a simple weighted heuristic
fatigue = (max(0, 10 - sleep_hours) / 10) * 0.5 + (stress_level / 10) * 0.4
if worked_out_yesterday == "Yes":
    fatigue += 0.1
fatigue = round(min(fatigue, 1.0), 2)

st.slider("Estimated Fatigue Level", 0.0, 1.0, fatigue, step=0.01, disabled=True)
st.caption("Fatigue is automatically estimated from sleep, stress, and prior workout activity.")

# Other health parameters
heart_rate = st.slider("Heart Rate (bpm)", 100, 190, 140)
bmi = st.slider("BMI", 18, 35, 24)
duration = st.slider("Planned Workout Duration (mins)", 20, 90, 45)

# API endpoint
api_url = "http://127.0.0.1:5000/predict"

# Submit button
if st.button("Get Recommendation"):
    input_data = {
        "Cycle_Phase": cycle_phase,
        "Estrogen_Level": estrogen,
        "Progesterone_Level": progesterone,
        "Fatigue_Level": fatigue,
        "heart_rate": heart_rate,
        "bmi": bmi,
        "duration": duration
    }

    try:
        response = requests.post(api_url, headers={"Content-Type": "application/json"}, data=json.dumps(input_data))
        if response.status_code == 200:
            result = response.json()
            st.success(f"🏋️ Recommended Workout: **{result['recommendation']}**")

            st.subheader("Model Confidence:")
            st.bar_chart(result["confidence"])

        else:
            st.error(f"Error: {response.text}")
    except Exception as e:
        st.error(f"Connection Error: {e}")
