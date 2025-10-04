#!/usr/bin/env python3
"""
ExoSeekr Backend - Mock Implementation
FastAPI backend with mock endpoints for exoplanet detection testing
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import random

from fastapi import FastAPI, HTTPException, UploadFile, File, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(
    title="ExoSeekr API",
    description="AI-driven exoplanet detection backend",
    version="1.1.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums and Models
class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class JobType(str, Enum):
    TRAINING = "training"
    PREDICTION = "prediction"

class ModelType(str, Enum):
    MUTABLE = "mutable"
    BACKUP = "backup"

class Job(BaseModel):
    job_id: str
    type: JobType
    status: JobStatus
    progress: int  # 0-100
    created_at: datetime
    updated_at: datetime
    model: Optional[ModelType] = ModelType.MUTABLE
    message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None

class TrainingRequest(BaseModel):
    model: Optional[ModelType] = ModelType.MUTABLE
    hyperparameters: Optional[Dict[str, Any]] = None

class PredictionRequest(BaseModel):
    model: Optional[ModelType] = ModelType.MUTABLE
    data_source: Optional[str] = None

class LoadDataRequest(BaseModel):
    dataset_name: str
    description: Optional[str] = None

# In-memory storage (replace with database in production)
jobs_store: Dict[str, Job] = {}
models_store: Dict[ModelType, Dict[str, Any]] = {
    ModelType.MUTABLE: {
        "name": "mutable",
        "version": "1.0.0",
        "accuracy": 0.92,
        "created_at": datetime.now() - timedelta(days=2),
        "status": "trained"
    },
    ModelType.BACKUP: {
        "name": "backup",
        "version": "0.9.5",
        "accuracy": 0.89,
        "created_at": datetime.now() - timedelta(days=7),
        "status": "trained"
    }
}

# Mock data for results
mock_predictions = {
    "total_lightcurves": 150,
    "exoplanets_detected": 23,
    "false_positives": 3,
    "accuracy": 0.92,
    "precision": 0.88,
    "recall": 0.94,
    "f1_score": 0.91,
    "predictions": [
        {
            "lightcurve_id": f"TIC_{100000 + i}",
            "transit_detected": random.choice([True, False]),
            "confidence": round(random.uniform(0.6, 0.99), 3),
            "period_days": round(random.uniform(1.5, 365.0), 2) if random.choice([True, False]) else None,
            "depth_ppm": round(random.uniform(100, 5000), 1) if random.choice([True, False]) else None
        }
        for i in range(25)
    ]
}

# Background task simulation
async def simulate_job_progress(job_id: str):
    """Simulate job progress over time"""
    job = jobs_store[job_id]
    
    # Simulate realistic progress
    progress_steps = [0, 15, 35, 50, 70, 85, 95, 100]
    
    for progress in progress_steps:
        if job.status == JobStatus.FAILED:
            break
            
        job.progress = progress
        job.updated_at = datetime.now()
        
        if progress == 100:
            job.status = JobStatus.COMPLETED
            
            # Add mock results based on job type
            if job.type == JobType.TRAINING:
                job.result = {
                    "model_accuracy": round(random.uniform(0.85, 0.95), 3),
                    "training_loss": round(random.uniform(0.1, 0.3), 4),
                    "validation_loss": round(random.uniform(0.12, 0.35), 4),
                    "epochs": random.randint(10, 50),
                    "training_time_seconds": random.randint(120, 600)
                }
                job.message = "Model training completed successfully"
                
                # Update model store
                models_store[job.model]["accuracy"] = job.result["model_accuracy"]
                models_store[job.model]["updated_at"] = datetime.now()
                
            elif job.type == JobType.PREDICTION:
                job.result = {
                    "predictions_generated": random.randint(100, 200),
                    "exoplanets_detected": random.randint(15, 30),
                    "processing_time_seconds": random.randint(30, 120)
                }
                job.message = "Predictions completed successfully"
        else:
            job.status = JobStatus.RUNNING
            
        await asyncio.sleep(2)  # Wait 2 seconds between updates

# Routes
@app.get("/")
async def root():
    return {
        "message": "ExoSeekr API is running",
        "version": "1.1.0",
        "status": "healthy",
        "endpoints": [
            "/load", "/train", "/predict", 
            "/jobs/{job_id}/status", "/results", "/models/list"
        ]
    }

@app.post("/load")
async def load_data(request: LoadDataRequest):
    """Mock endpoint for data ingestion"""
    # Simulate processing delay
    await asyncio.sleep(1)
    
    return {
        "status": "success",
        "message": f"Dataset '{request.dataset_name}' loaded successfully",
        "dataset_info": {
            "name": request.dataset_name,
            "description": request.description,
            "lightcurves_count": random.randint(100, 500),
            "file_size_mb": round(random.uniform(10.5, 250.8), 1),
            "loaded_at": datetime.now().isoformat()
        }
    }

@app.post("/train")
async def start_training(
    request: TrainingRequest,
    background_tasks: BackgroundTasks,
    model: Optional[ModelType] = Query(None)
):
    """Start model training (async)"""
    job_id = str(uuid.uuid4())
    model_type = model or request.model or ModelType.MUTABLE
    
    # Create job
    job = Job(
        job_id=job_id,
        type=JobType.TRAINING,
        status=JobStatus.PENDING,
        progress=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        model=model_type,
        message="Training job queued"
    )
    
    jobs_store[job_id] = job
    
    # Start background task
    background_tasks.add_task(simulate_job_progress, job_id)
    
    return {
        "job_id": job_id,
        "status": "started",
        "message": f"Training started for model '{model_type.value}'"
    }

@app.post("/predict")
async def start_prediction(
    request: PredictionRequest,
    background_tasks: BackgroundTasks,
    model: Optional[ModelType] = Query(None)
):
    """Start inference on data (async)"""
    job_id = str(uuid.uuid4())
    model_type = model or request.model or ModelType.MUTABLE
    
    # Create job
    job = Job(
        job_id=job_id,
        type=JobType.PREDICTION,
        status=JobStatus.PENDING,
        progress=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        model=model_type,
        message="Prediction job queued"
    )
    
    jobs_store[job_id] = job
    
    # Start background task
    background_tasks.add_task(simulate_job_progress, job_id)
    
    return {
        "job_id": job_id,
        "status": "started",
        "message": f"Prediction started using model '{model_type.value}'"
    }

@app.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str):
    """Check job progress and status"""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_store[job_id]
    
    return {
        "job_id": job_id,
        "type": job.type.value,
        "status": job.status.value,
        "progress": job.progress,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
        "model": job.model.value if job.model else None,
        "message": job.message,
        "result": job.result
    }

@app.get("/results")
async def get_results(model: Optional[ModelType] = Query(ModelType.MUTABLE)):
    """Retrieve predictions and accuracy statistics"""
    
    # Simulate some variation based on model
    if model == ModelType.BACKUP:
        modified_predictions = mock_predictions.copy()
        modified_predictions["accuracy"] = 0.89
        modified_predictions["precision"] = 0.86
        modified_predictions["recall"] = 0.91
        modified_predictions["f1_score"] = 0.88
        return modified_predictions
    
    return mock_predictions

@app.get("/models/list")
async def list_models():
    """List available models"""
    return {
        "models": [
            {
                "name": model_type.value,
                "display_name": model_data["name"].title(),
                "version": model_data["version"],
                "accuracy": model_data["accuracy"],
                "status": model_data["status"],
                "created_at": model_data["created_at"].isoformat(),
                "updated_at": model_data.get("updated_at", model_data["created_at"]).isoformat()
            }
            for model_type, model_data in models_store.items()
        ],
        "total_models": len(models_store)
    }

# Additional utility endpoints for frontend development
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.1.0"
    }

@app.get("/jobs")
async def list_jobs():
    """List all jobs (useful for debugging)"""
    return {
        "jobs": [
            {
                "job_id": job_id,
                "type": job.type.value,
                "status": job.status.value,
                "progress": job.progress,
                "created_at": job.created_at.isoformat(),
                "model": job.model.value if job.model else None
            }
            for job_id, job in jobs_store.items()
        ],
        "total_jobs": len(jobs_store)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

