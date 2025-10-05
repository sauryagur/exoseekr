#!/usr/bin/env python3


import asyncio
import uuid
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import numpy as np
import tensorflow as tf

from fastapi import FastAPI, HTTPException, UploadFile, File, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# --- Configuration ---
MODEL_PATH = r"best_model.h5"
# --- End Configuration ---

# Initialize FastAPI app
app = FastAPI(
    title="ExoSeekr API",
    description="AI-driven exoplanet detection backend",
    version="1.2.0"  # Version updated
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to hold the loaded model
model = None


# --- Lifespan Events ---
@app.on_event("startup")
async def startup_event():
    """Load the Keras model on application startup."""
    global model
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print("INFO:     Keras model loaded successfully from", MODEL_PATH)
    except Exception as e:
        print(f"ERROR:    Failed to load Keras model: {e}")
        # In a real application, you might want to prevent startup
        # or handle this more gracefully.
        model = None


# --- Enums and Models ---
class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, Enum):
    TRAINING = "training"
    PREDICTION = "prediction"


class ModelType(str, Enum):
    CUSTOM = "custom"  # Renamed from MUTABLE
    BACKUP = "backup"


class Job(BaseModel):
    job_id: str
    type: JobType
    status: JobStatus
    progress: int = Field(..., ge=0, le=100)
    created_at: datetime
    updated_at: datetime
    model: Optional[ModelType] = ModelType.CUSTOM
    message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None


class PredictionRequest(BaseModel):
    # This now expects a list of lightcurves for prediction
    lightcurves: List[List[float]] = Field(..., example=[[1.0, 1.1, 0.9, ...]])
    model: Optional[ModelType] = ModelType.CUSTOM


class TrainingRequest(BaseModel):
    model: Optional[ModelType] = ModelType.CUSTOM
    hyperparameters: Optional[Dict[str, Any]] = None


# --- In-memory Storage (for demonstration) ---
jobs_store: Dict[str, Job] = {}


# --- Background Task Simulation ---
async def simulate_prediction_job(job_id: str, lightcurves: List[List[float]]):
    """
    Simulate a prediction job using the actual model.
    """
    global model
    job = jobs_store[job_id]
    job.status = JobStatus.RUNNING
    job.updated_at = datetime.now()

    if model is None:
        job.status = JobStatus.FAILED
        job.message = "Prediction failed: Model is not loaded."
        job.updated_at = datetime.now()
        return

    try:

        await asyncio.sleep(1)
        job.progress = 25
        job.updated_at = datetime.now()

        data = np.array(lightcurves)
        if data.ndim == 2:
            data = np.expand_dims(data, axis=-1)

        await asyncio.sleep(1)
        job.progress = 50
        job.message = "Data preprocessed. Running inference..."
        job.updated_at = datetime.now()

        # Make predictions
        predictions = model.predict(data)

        await asyncio.sleep(2)  # Simulate inference time
        job.progress = 90
        job.message = "Inference complete. Formatting results..."
        job.updated_at = datetime.now()

        # Format results
        results_list = []
        for i, pred in enumerate(predictions):
            # Assuming model output is a probability for class 1 (exoplanet)
            confidence = float(pred[0])
            detected = bool(confidence > 0.5)  # Example threshold
            results_list.append({
                "lightcurve_index": i,
                "exoplanet_detected": detected,
                "confidence_score": round(confidence, 4)
            })

        job.status = JobStatus.COMPLETED
        job.progress = 100
        job.message = "Prediction completed successfully."
        job.result = {
            "total_lightcurves": len(lightcurves),
            "exoplanets_detected": sum(1 for r in results_list if r["exoplanet_detected"]),
            "predictions": results_list
        }
        job.updated_at = datetime.now()

    except Exception as e:
        job.status = JobStatus.FAILED
        job.message = f"An error occurred during prediction: {str(e)}"
        job.updated_at = datetime.now()

@app.get("/")
async def root():
    return {"message": "ExoSeekr API is running", "version": "1.2.0"}


@app.post("/predict", status_code=202)
async def start_prediction(
        request: PredictionRequest,
        background_tasks: BackgroundTasks
):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not available. Please try again later.")

    job_id = str(uuid.uuid4())

    job = Job(
        job_id=job_id,
        type=JobType.PREDICTION,
        status=JobStatus.PENDING,
        progress=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        model=request.model,
        message="Prediction job queued"
    )
    jobs_store[job_id] = job
    background_tasks.add_task(simulate_prediction_job, job_id, request.lightcurves)

    return {
        "job_id": job_id,
        "status": "started",
        "message": f"Prediction started using model '{request.model.value}'"
    }


@app.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    """Check job progress and status."""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_store[job_id]


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy" if model else "degraded",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)