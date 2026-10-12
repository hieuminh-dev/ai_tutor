"""
ML Model Training Script
Trains a Random Forest classifier to predict student performance.
Uses the real user dataset: data/AI_Personalized_Learning.csv

Run this script from the backend directory:
    python -m app.ml.train_model

The model is saved to: ml_models/performance_predictor.pkl
"""
import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib

# Target labels in the application
LABELS = ["At-Risk", "Moderate Success", "High Success"]


def find_dataset_path() -> str:
    """Find the path to the CSV dataset across multiple possible directories."""
    paths = [
        os.path.join("..", "data", "AI_Personalized_Learning.csv"),
        os.path.join("data", "AI_Personalized_Learning.csv"),
        os.path.join("d:\\FLL\\RAJA\\data", "AI_Personalized_Learning.csv"),
        "AI_Personalized_Learning.csv"
    ]
    for p in paths:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Could not locate AI_Personalized_Learning.csv in any expected paths.")


def load_real_data() -> pd.DataFrame:
    """
    Load the CSV dataset and preprocess/feature engineer columns to
    match the features tracked live inside the web application:
        - avg_quiz_score (from quiz_accuracy)
        - completion_rate (from completed_modules)
        - total_time_seconds (completed_modules * avg_time_per_module * 60)
        - quiz_attempts (from completed_modules)
        - distraction_events (from distraction_events)
    """
    csv_path = find_dataset_path()
    print(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)

    # Preprocess features to align with live schema
    df['avg_quiz_score'] = df['quiz_accuracy']
    df['completion_rate'] = (df['completed_modules'] / 10.0) * 100.0
    df['total_time_seconds'] = df['completed_modules'] * df['avg_time_per_module'] * 60.0
    df['quiz_attempts'] = df['completed_modules']
    # distraction_events is already in the CSV

    # Map Target learning_outcome -> application labels
    # Excellent/Good -> High Success, Fair -> Moderate Success, Fail -> At-Risk
    label_map = {
        "Excellent": "High Success",
        "Good": "High Success",
        "Fair": "Moderate Success",
        "Fail": "At-Risk"
    }
    df['label'] = df['learning_outcome'].map(label_map)

    # Drop any rows where label mapping failed
    df = df.dropna(subset=['label'])
    return df


def train():
    df = load_real_data()
    print(f"Dataset size: {len(df)} samples")
    print(f"Label distribution:\n{df['label'].value_counts()}\n")

    features_cols = ['avg_quiz_score', 'completion_rate', 'total_time_seconds', 'quiz_attempts', 'distraction_events']
    X = df[features_cols].values
    y = df["label"].values

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    print("Training Random Forest Classifier on Real Dataset...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=10,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {acc:.2%}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Save model and label encoder
    # Ensure directory is created in workspace roots
    os.makedirs("ml_models", exist_ok=True)
    os.makedirs("../ml_models", exist_ok=True)

    model_bundle = {"model": model, "label_encoder": le}
    
    # Save in both backend/ml_models and root/ml_models for flexibility
    for save_dir in ["ml_models", "../ml_models"]:
        try:
            model_path = os.path.join(save_dir, "performance_predictor.pkl")
            joblib.dump(model_bundle, model_path)
            print(f"Model saved successfully to: {model_path}")
        except Exception as e:
            # Silence expected dir permissions in non-existent folders
            pass
            
    return model, le


if __name__ == "__main__":
    train()
