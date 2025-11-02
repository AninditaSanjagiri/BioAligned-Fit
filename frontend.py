# frontend.py
import streamlit as st
import requests
import json
import plotly.graph_objects as go

# ---------------------- PAGE CONFIG ----------------------
st.set_page_config(
    page_title="BioAligned Fit",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ---------------------- GLOBAL THEME ----------------------
st.markdown(
    """
    <style>
        /* Entire page gradient background */
        .stApp {
            background: linear-gradient(135deg, #eef2ff 0%, #f7f9fc 100%);
            color: #0f1724;
            font-family: "Inter", sans-serif;
        }

        /* Header bar */
        [data-testid="stHeader"] {
            background: linear-gradient(90deg, #3b82f6, #6366f1);
            color: white !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        /* App title styling */
        h1 {
            color: #1e293b;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        /* Center content area but expand width */
        .block-container {
            max-width: 950px !important;
            padding-top: 2rem;
        }

        /* Section cards */
        .section-card {
            background-color: #ffffff;
            padding: 22px 26px;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
            margin-bottom: 24px;
        }

        .section-label {
            display:block;
            font-size:17px;
            font-weight:600;
            color:#1e293b;
            margin-bottom:10px;
        }

        /* Buttons */
        div.stButton > button:first-child {
            background: linear-gradient(90deg, #2563eb, #4f46e5);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 20px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 3px 8px rgba(37,99,235,0.3);
        }
        div.stButton > button:first-child:hover {
            background: linear-gradient(90deg, #1d4ed8, #4338ca);
        }

        /* Make all labels and captions readable */
        label, .stMarkdown, .stText, .stCaption {
            color: #0f1724 !important;
        }

        #MainMenu, footer {visibility: hidden;}
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------- HEADER ----------------------
st.markdown("<h1 style='text-align:center;'>BioAligned Fit</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align:center;color:#475569;'>Cycle-aware workout recommendation system</p>", unsafe_allow_html=True)

# ---------------------- INPUT: Cycle Phase & Hormones ----------------------
st.markdown('<div class="section-card">', unsafe_allow_html=True)
st.markdown('<span class="section-label">Cycle Phase & Hormone Details</span>', unsafe_allow_html=True)

cycle_phase = st.selectbox("Select your current menstrual phase:", ["Menstrual", "Follicular", "Ovulatory", "Luteal"])

phase_defaults = {
    "Menstrual": {"Estrogen_Level": 20, "Progesterone_Level": 10},
    "Follicular": {"Estrogen_Level": 70, "Progesterone_Level": 15},
    "Ovulatory": {"Estrogen_Level": 90, "Progesterone_Level": 20},
    "Luteal": {"Estrogen_Level": 60, "Progesterone_Level": 80},
}

default_estrogen = phase_defaults[cycle_phase]["Estrogen_Level"]
default_progesterone = phase_defaults[cycle_phase]["Progesterone_Level"]

col1, col2 = st.columns(2)
with col1:
    estrogen = st.slider("Estimated Estrogen Level", 10, 100, default_estrogen)
with col2:
    progesterone = st.slider("Estimated Progesterone Level", 10, 100, default_progesterone)

st.caption("Hormone levels are automatically adjusted based on your selected cycle phase.")
st.markdown('</div>', unsafe_allow_html=True)

# ---------------------- INPUT: Lifestyle (Fatigue Estimation) ----------------------
st.markdown('<div class="section-card">', unsafe_allow_html=True)
st.markdown('<span class="section-label">Lifestyle Factors (Fatigue Estimation)</span>', unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)
with col1:
    sleep_hours = st.slider("Sleep (hours, last night)", 3, 10, 7)
with col2:
    stress_level = st.slider("Stress Level (0 relaxed - 10 high)", 0, 10, 5)
with col3:
    worked_out_yesterday = st.selectbox("Worked out yesterday?", ["No", "Yes"])

fatigue = (max(0, 10 - sleep_hours) / 10) * 0.5 + (stress_level / 10) * 0.4
if worked_out_yesterday == "Yes":
    fatigue += 0.1
fatigue = round(min(fatigue, 1.0), 2)

st.slider("Estimated Fatigue Level", 0.0, 1.0, fatigue, step=0.01, disabled=True)
st.caption("Fatigue is derived from sleep, stress, and recent workout activity.")
st.markdown('</div>', unsafe_allow_html=True)

# ---------------------- INPUT: Health Metrics ----------------------
st.markdown('<div class="section-card">', unsafe_allow_html=True)
st.markdown('<span class="section-label">Health Metrics</span>', unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)
with col1:
    heart_rate = st.slider("Heart Rate (bpm)", 50, 200, 140)
with col2:
    bmi = st.slider("BMI", 14.0, 40.0, 24.0)
with col3:
    duration = st.slider("Planned Workout Duration (mins)", 10, 120, 45)

st.markdown('</div>', unsafe_allow_html=True)

# ---------------------- API CALL ----------------------
api_url = "http://127.0.0.1:5000/predict"

st.markdown('<div class="section-card">', unsafe_allow_html=True)
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

    with st.spinner("Generating personalized recommendation..."):
        try:
            response = requests.post(api_url, headers={"Content-Type": "application/json"}, data=json.dumps(input_data), timeout=10)
            if response.status_code == 200:
                result = response.json()

                st.subheader("Recommended Workout")
                st.success(result.get("recommendation", "No recommendation returned"))

                st.subheader("Model Confidence")
                conf = result.get("confidence", {})

                if isinstance(conf, dict) and conf:
                    # Plotly bar chart with theme-matched colors
                    fig = go.Figure()
                    fig.add_trace(go.Bar(
                        x=list(conf.keys()),
                        y=list(conf.values()),
                        marker_color=["#3b82f6" if v == max(conf.values()) else "#a5b4fc" for v in conf.values()],
                        text=[f"{v*100:.1f}%" for v in conf.values()],
                        textposition="outside"
                    ))
                    fig.update_layout(
                        xaxis_title="Workout Type",
                        yaxis_title="Confidence",
                        yaxis=dict(range=[0, 1]),
                        template="simple_white",
                        height=380,
                        margin=dict(l=40, r=40, t=20, b=40),
                        font=dict(color="#0f1724", size=14),
                    )
                    st.plotly_chart(fig, use_container_width=True)
                else:
                    st.info("Model confidence data unavailable.")
            else:
                st.error(f"Server Error: {response.text}")
        except requests.exceptions.RequestException as e:
            st.error(f"Connection Error: {e}")

st.markdown('</div>', unsafe_allow_html=True)

# ---------------------- FOOTER ----------------------
st.markdown(
    "<div style='text-align:center;color:#64748b;margin-top:22px;font-size:13px;'>BioAligned Fit — Data-driven cycle-aware fitness assistant</div>",
    unsafe_allow_html=True,
)
