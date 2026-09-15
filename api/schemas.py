from pydantic import BaseModel, Field
from typing import List, Optional

class BiometricInput(BaseModel):
    # Daily Subjective Log
    energy: str
    mood: str
    stress: str
    
    # Cycle Context
    phase: str
    current_day: int
    last_workout: Optional[str] = "None"
    
    # User Profile (From Onboarding)
    age: int = 28
    primary_goal: str = "Build Strength & Muscle"
    training_days: List[str] = ["M", "T", "W", "T", "F"]

class WorkoutRecommendation(BaseModel):
    predicted_intensity_class: int
    intensity_label: str
    gemini_generated_routine: Optional[str] = None