import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_workout(intensity: str, phase: str, goal: str, stress: str, energy: str, target_split: str, last_workout: str) -> str:
    prompt = f"""
    Act as an elite female physiology and fitness coach. 
    Generate a daily workout routine tailored to the user's biological cycle, goals, and daily readiness.
    
    User Context:
    - Primary Goal: {goal}
    - Current Phase: {phase}
    - Target Muscle Group Today: {target_split}
    - Previous Workout Target: {last_workout}
    - Daily Energy: {energy}
    - Daily Stress: {stress}
    - ML Target Intensity: {intensity}
    
    Rules for Generation:
    1. CRITICAL RECOVERY RULE: The user previously trained '{last_workout}'. To prevent CNS burnout and overtraining, you MUST focus today's exercises EXCLUSIVELY on the new target: '{target_split}'.
    2. Adjust volume and load strictly based on the {phase} and ML Target Intensity ({intensity}). 
    3. Format the response EXACTLY using the Markdown structure below. Do not deviate.
    4. Include rest times in the headers as shown below.
    
    REQUIRED FORMAT:
    ### Biological Rationale
    [1 paragraph explaining why this workout fits her phase and goal. Explicitly mention the recovery pivot away from '{last_workout}' to '{target_split}', and explain the adjustment made for her current stress/energy level.]
    
    ---
    
    ### Warm-Up & CNS Prep (5-8 Minutes)
    [Brief focus note]
    * **[Exercise Name]:** [Sets/Reps] ([Form note])
    * **[Exercise Name]:** [Sets/Reps] ([Form note])
    
    ### Primary Block — [X] Sets (Rest [X]s)
    [Brief intensity note, e.g., RPE target]
    * **[Exercise Name]:** [Sets/Reps]
    * **[Exercise Name]:** [Sets/Reps]
    
    ### Accessory Block — [X] Sets (Rest [X]s)
    * **[Exercise Name]:** [Sets/Reps]
    * **[Exercise Name]:** [Sets/Reps]
    
    ### Parasympathetic Reset (3-5 Minutes)
    * **[Pose/Stretch]:** [Duration]
    * **[Pose/Stretch]:** [Duration]
    """
    
    
    try:
        # gemini-3.5-flash is the current recommended production model for fast text generation
        model = genai.GenerativeModel('gemini-3.5-flash')
        response = model.generate_content(prompt)
        
        # Strip any accidental markdown code block wrappers so the React parser doesn't break
        clean_text = response.text.strip()
        if clean_text.startswith("```markdown"):
            clean_text = clean_text[11:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        return clean_text.strip()
    except Exception as e:
        return f"### System Notice\nRoutine generation temporarily unavailable: {str(e)}"