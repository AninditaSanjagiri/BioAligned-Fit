from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.firebase_auth import verify_firebase_token
from api.database import get_user_profile, determine_next_split, save_workout_plan, log_daily_biometrics
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from api.schemas import BiometricInput, WorkoutRecommendation
from api.gemini_service import generate_workout

app = FastAPI(title="BioAligned-Fit API", version="1.0")

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "rf_activity_model.pkl"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Allows your React app to connect
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Load Machine Learning Model
try:
    rf_model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    rf_model = None

INTENSITY_LABELS = {0: "Light", 1: "Moderate", 2: "High"}

@app.post("/predict", response_model=WorkoutRecommendation)
async def predict_workout(
    data: BiometricInput, 
    token: dict = Depends(verify_firebase_token) # Securely identifies the user
):
    if rf_model is None:
        raise HTTPException(status_code=500, detail="ML model not found on server.")

    uid = token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid User ID")

    # 1. Fetch live database profile (DOB, Cycle Length, Goals)
    user_profile = get_user_profile(uid)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found. Please complete onboarding.")

    user_phase = user_profile.get("current_phase", "Follicular Phase")
    user_age = user_profile.get("current_age", 28)
    user_goal = user_profile.get("primary_goal", "General Fitness")

    # 2. Log today's biometrics to the database
    log_daily_biometrics(uid, {
        "energy": data.energy,
        "mood": data.mood,
        "stress": data.stress,
        "calculated_phase": user_phase,
        "calculated_cycle_day": user_profile.get("current_day", 0)
    })

    # 3. Calculate today's targeted muscle split
    todays_split = determine_next_split(uid)

    # 4. Map Frontend Strings to ML Integers
    energy_to_fatigue = {"Very Low": 5, "Low": 4, "Moderate": 3, "High": 2, "Very High": 1}
    stress_to_score = {"Minimal": 20.0, "Moderate": 50.0, "High": 80.0, "Overwhelming": 95.0}
    
    fatigue_encoded = energy_to_fatigue.get(data.energy, 3)
    stress_score = stress_to_score.get(data.stress, 50.0)
    
    # Infer Overall Mood Score (0-100)
    overall_score = 80.0 if data.mood in ["Positive", "Highly Motivated"] else 50.0 if data.mood == "Flat" else 30.0

    # 5. Infer Invisible Biometrics based on Biological Phase
    if "Follicular" in user_phase:
        estrogen, pdg, lh, rhr, temp = 150.0, 1.5, 5.0, 60.0, 36.2
        phase_encoded = 1
    elif "Ovulatory" in user_phase:
        estrogen, pdg, lh, rhr, temp = 300.0, 2.0, 40.0, 62.0, 36.4
        phase_encoded = 2
    elif "Luteal" in user_phase:
        estrogen, pdg, lh, rhr, temp = 200.0, 15.0, 5.0, 65.0, 36.7
        phase_encoded = 3
    else: # Menstrual
        estrogen, pdg, lh, rhr, temp = 50.0, 1.0, 4.0, 63.0, 36.3
        phase_encoded = 0

    # 6. Assemble the 10 features as a Pandas DataFrame
    features_df = pd.DataFrame([[
        phase_encoded, user_age, estrogen, pdg, lh,
        rhr, temp, overall_score, stress_score, fatigue_encoded
    ]], columns=[
        "phase_encoded", "age", "estrogen", "pdg", "lh",  # <--- Changed "phase" to "phase_encoded"
        "resting_heart_rate", "temperature_celsius", 
        "overall_score", "stress_score", "fatigue_encoded" # <--- Changed "fatigue" to "fatigue_encoded"
    ])

    try:
        # Predict Intensity Scale using the DataFrame
        prediction = int(rf_model.predict(features_df)[0])
        label = INTENSITY_LABELS.get(prediction, "Moderate")
        
        # 7. Pass everything to Gemini, including the new last_workout rule
        routine = generate_workout(
            intensity=label, 
            phase=user_phase, 
            goal=user_goal,
            stress=data.stress,
            energy=data.energy,
            target_split=todays_split,
            last_workout=data.last_workout # <--- Added this!
        )
        
        # 8. Save the newly generated workout to the user's history
        save_workout_plan(uid, {
            "target_split": todays_split,
            "duration_mins": 45,
            "raw_markdown": routine
        })
        
        return WorkoutRecommendation(
            predicted_intensity_class=prediction,
            intensity_label=label,
            gemini_generated_routine=routine
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")