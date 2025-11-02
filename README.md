BioAligned Fit 🧬

Cycle-Aware Workout Recommendation System

BioAligned Fit is a personalized fitness recommendation system that adapts workout intensity based on menstrual cycle phase, hormone levels, fatigue estimation, and key health parameters.
It uses a trained machine learning model to recommend the most suitable workout intensity — low, moderate, or high — for optimal alignment with the user’s physiology.

🚀 Features

Cycle-aware logic: Auto-estimates estrogen and progesterone based on menstrual phase.

Fatigue estimation: Calculates fatigue using lifestyle inputs like sleep, stress, and recovery.

Smart recommendations: Suggests low, moderate, or high-intensity workouts via an ML model.

Interactive frontend: Built using Streamlit with a clean, minimal UI.

REST API backend: Flask-based prediction API for modular use.

🧩 Tech Stack
Layer	Technology
Frontend	Streamlit
Backend	Flask
ML Model	Scikit-learn (RandomForestClassifier)
Data Handling	Pandas, NumPy
Visualization	Plotly
Version Control	Git & GitHub
⚙️ Setup and Run
1. Clone the repository
git clone https://github.com/<your-username>/BioAligned-Fit.git
cd BioAligned-Fit

2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate    # On Windows
# source venv/bin/activate  # On macOS/Linux

3. Install dependencies
pip install -r requirements.txt

4. Run the backend
python backend.py

5. Run the frontend

In a new terminal (keep backend running):

streamlit run frontend.py

🧠 How It Works

User selects menstrual cycle phase → model auto-fills estimated hormone levels.

User enters lifestyle and physical data (sleep, stress, BMI, etc.).

Fatigue is computed using a heuristic formula.

Data is sent to the Flask API → scaled and processed by the trained ML model.

Model predicts the most suitable workout intensity.

Confidence levels are displayed via an interactive Plotly bar chart.

📊 Example Output

Recommended Workout: Moderate Intensity (Cycling, Dance, Pilates)
Model Confidence:

Low	Moderate	High
0.15	0.73	0.12
📁 Project Structure
BioAligned-Fit/
│
├── models/                     # Saved ML model and scaler
│   ├── workout_recommendation_model.pkl
│   └── scaler.pkl
│
├── notebooks/                  # Data exploration & model training notebooks
│   ├── 00_data_cleaning.ipynb
│   ├── 01_data_exploration.ipynb
│   ├── 02_feature_engineering.ipynb
│   ├── 03_modeling_and_analysis.ipynb
│   └── 04_recommendation_model.ipynb
│
├── backend.py                  # Flask API
├── frontend.py                 # Streamlit interface
├── requirements.txt
└── README.md

✨ Future Improvements

Integrate with wearable fitness trackers for real-time data.

Add personalized workout plans and progress tracking.

Deploy on cloud (Render/Streamlit Cloud) for public use.

Add multilingual support for inclusivity.
