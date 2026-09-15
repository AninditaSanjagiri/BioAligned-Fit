import pandas as pd
from pathlib import Path

def build_dataset():
    # Dynamically resolve project root directory
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    raw_dir = project_root / 'data' / 'raw'
    processed_dir = project_root / 'data' / 'processed'
    
    # Ensure the processed directory exists
    processed_dir.mkdir(parents=True, exist_ok=True)

    # 1. Load Data using absolute paths
    subject_info = pd.read_csv(raw_dir / 'subject-info.csv')
    hormones = pd.read_csv(raw_dir / 'hormones_and_selfreport.csv')
    rhr = pd.read_csv(raw_dir / 'resting_heart_rate.csv')
    sleep = pd.read_csv(raw_dir / 'sleep_score.csv')
    temp = pd.read_csv(raw_dir / 'computed_temperature.csv')
    stress = pd.read_csv(raw_dir / 'stress_score.csv')

    # Standardize join keys
    temp.rename(columns={
        'sleep_start_day_in_study': 'day_in_study', 
        'nightly_temperature': 'temperature_celsius'
    }, inplace=True)

    # 2. Clean and Deduplicate Daily Logs
    rhr = rhr.drop_duplicates(subset=['id', 'day_in_study'])
    sleep = sleep.drop_duplicates(subset=['id', 'day_in_study'])
    temp = temp.drop_duplicates(subset=['id', 'day_in_study'])
    stress = stress.drop_duplicates(subset=['id', 'day_in_study'])

    # 3. Merge Datasets (Left join onto the hormone log base)
    df = pd.merge(hormones, rhr[['id', 'day_in_study', 'value']], on=['id', 'day_in_study'], how='left')
    df.rename(columns={'value': 'resting_heart_rate'}, inplace=True)
    df = pd.merge(df, sleep[['id', 'day_in_study', 'overall_score', 'deep_sleep_in_minutes']], on=['id', 'day_in_study'], how='left')
    df = pd.merge(df, temp[['id', 'day_in_study', 'temperature_celsius']], on=['id', 'day_in_study'], how='left')
    df = pd.merge(df, stress[['id', 'day_in_study', 'stress_score']], on=['id', 'day_in_study'], how='left')

    # Add Demographic features (Age calculation based on birth year)
    df = pd.merge(df, subject_info[['id', 'birth_year']], on='id', how='left')
    df['age'] = 2026 - df['birth_year']

    # 4. Filter & Clean Target Variable (exerciselevel)
    df = df.dropna(subset=['exerciselevel'])

    # Simplify physical activity into a distinct 5-point integer scale
    intensity_mapping = {
        'Not at all': 0,
        'Very Low': 1,
        'Low': 2,
        'Moderate': 3,
        'High': 4,
        'Very High': 5
    }
    df['exercise_target'] = df['exerciselevel'].map(intensity_mapping)

    # 5. Handle Missing Biomarkers (Imputation)
    numeric_features = [
        'estrogen', 'pdg', 'lh', 'resting_heart_rate', 
        'overall_score', 'temperature_celsius', 'stress_score'
    ]
    
    # Forward-fill then backward-fill per user to maintain longitudinal physiological trends
    for col in numeric_features:
        df[col] = df.groupby('id')[col].transform(lambda x: x.ffill().bfill())

    # Fallback to global median for users missing a specific metric entirely
    for col in numeric_features:
        df[col] = df[col].fillna(df[col].median())

    # 6. Feature Selection
    selected_features = [
        'id', 'day_in_study', 'phase', 'age', 
        'estrogen', 'pdg', 'lh', 
        'resting_heart_rate', 'temperature_celsius', 
        'overall_score', 'stress_score', 
        'fatigue', 'exercise_target'
    ]

    final_dataset = df[selected_features].copy()
    output_path = processed_dir / 'mcphases_cycle_syncing.csv'
    final_dataset.to_csv(output_path, index=False)
    
    print(f"Dataset compiled: {len(final_dataset)} records successfully saved to {output_path}")

if __name__ == '__main__':
    build_dataset()