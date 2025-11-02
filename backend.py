# backend.py
from flask import Flask, request, jsonify
import pandas as pd
import joblib

app = Flask(__name__)

# Load model and scaler
model = joblib.load("models/workout_recommendation_model.pkl")
scaler = joblib.load("models/scaler.pkl")

# Phase mapping
phase_map = {"Menstrual": 0, "Follicular": 1, "Ovulatory": 2, "Luteal": 3}
intensity_map = {
    0: "Low Intensity (Yoga, Stretching, Walking)",
    1: "Moderate Intensity (Cycling, Dance, Pilates)",
    2: "High Intensity (HIIT, Strength Training)"
}

@app.route("/")
def home():
    return jsonify({"message": "Welcome to BioAligned Fit API"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        expected_fields = [
            "Cycle_Phase", "Estrogen_Level", "Progesterone_Level",
            "Fatigue_Level", "heart_rate", "bmi", "duration"
        ]
        for field in expected_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Prepare input
        df = pd.DataFrame([{
            "Cycle_Phase": phase_map.get(data["Cycle_Phase"], 0),
            "Estrogen_Level": data["Estrogen_Level"],
            "Progesterone_Level": data["Progesterone_Level"],
            "Fatigue_Level": data["Fatigue_Level"],
            "heart_rate": data["heart_rate"],
            "bmi": data["bmi"],
            "duration": data["duration"]
        }])

        scaled = scaler.transform(df)
        pred = model.predict(scaled)[0]
        probs = model.predict_proba(scaled)[0]

        return jsonify({
            "recommendation": intensity_map[int(pred)],
            "confidence": {
                "Low": round(probs[0], 2),
                "Moderate": round(probs[1], 2),
                "High": round(probs[2], 2)
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=False, port=5000)
