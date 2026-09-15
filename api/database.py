from firebase_admin import firestore
from datetime import datetime, timezone
import math

# Get a Firestore client instance
# (This automatically uses the credentials initialized in firebase_auth.py)
db = firestore.client()

def calculate_age(dob: datetime) -> int:
    """Calculates exact age from a Date of Birth."""
    today = datetime.now(timezone.utc)
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

def get_cycle_context(last_period_start: datetime, avg_cycle_length: int) -> dict:
    """Dynamically calculates the current cycle day and biological phase."""
    today = datetime.now(timezone.utc)
    days_since_start = (today - last_period_start).days
    
    # Calculate current day in the cycle (e.g., Day 9)
    current_day = (days_since_start % avg_cycle_length) + 1
    
    # Scale the standard 28-day phases to the user's actual cycle length
    scale_factor = avg_cycle_length / 28.0
    
    if current_day <= math.ceil(5 * scale_factor):
        phase = "Menstrual Phase"
    elif current_day <= math.ceil(13 * scale_factor):
        phase = "Follicular Phase"
    elif current_day <= math.ceil(16 * scale_factor):
        phase = "Ovulatory Phase"
    else:
        phase = "Luteal Phase"
        
    return {"current_day": current_day, "phase": phase}

def save_user_profile(uid: str, profile_data: dict):
    """Creates or updates the permanent user profile."""
    profile_data["updated_at"] = firestore.SERVER_TIMESTAMP
    db.collection("users").document(uid).set(profile_data, merge=True)

def get_user_profile(uid: str) -> dict:
    """Fetches the user profile and calculates real-time dynamic fields."""
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return None
        
    data = doc.to_dict()
    
    # Dynamically inject current age and cycle phase into the returned data
    if "date_of_birth" in data:
        data["current_age"] = calculate_age(data["date_of_birth"])
        
    if "last_period_start" in data and "average_cycle_length" in data:
        cycle_info = get_cycle_context(data["last_period_start"], data["average_cycle_length"])
        data["current_day"] = cycle_info["current_day"]
        data["current_phase"] = cycle_info["phase"]
        
    return data

def log_daily_biometrics(uid: str, log_data: dict):
    """Saves daily subjective logs (Energy, Mood, Stress) by date."""
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    log_data["timestamp"] = firestore.SERVER_TIMESTAMP
    
    db.collection("users").document(uid).collection("daily_logs").document(today_str).set(log_data, merge=True)

def determine_next_split(uid: str) -> str:
    """Queries the user's workout history to prevent overtraining muscle groups."""
    workouts_ref = db.collection("users").document(uid).collection("workouts")
    # Fetch the most recently assigned workout
    query = workouts_ref.order_by("date_assigned", direction=firestore.Query.DESCENDING).limit(1)
    results = query.stream()
    
    last_split = "Rest"
    for doc in results:
        last_split = doc.to_dict().get("target_split", "Rest")
        
    # Micro-Cycle Logic
    split_progression = {
        "Rest": "Lower Body",
        "Lower Body": "Upper Body",
        "Upper Body": "Core & Active Recovery",
        "Core & Active Recovery": "Full Body Functional",
        "Full Body Functional": "Lower Body"
    }
    
    return split_progression.get(last_split, "Lower Body")

def save_workout_plan(uid: str, workout_data: dict) -> str:
    """Saves the generated AI workout into the history planner."""
    workout_data["date_assigned"] = firestore.SERVER_TIMESTAMP
    workout_data["status"] = "Saved" # Changes to "Completed" when they finish the Focus Mode
    
    _, doc_ref = db.collection("users").document(uid).collection("workouts").add(workout_data)
    return doc_ref.id