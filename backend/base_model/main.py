# exoseekr/backend/base_model/main.py
import os
import threading
import uuid
import traceback
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

# Import the predict_model entrypoint
from classical_model.base_model.randomforest_TESS import predict_model

app = FastAPI(title="ExoSeekr — Base Model (Immutable)")

# Simple in-memory job store
# job_id -> { status: 'PENDING'|'RUNNING'|'FAILED'|'COMPLETED', started_at, finished_at, result, error }
JOB_STORE: Dict[str, Dict[str, Any]] = {}

# Ensure plots directory exists (server startup)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PLOTS_DIR = os.path.join(PROJECT_ROOT, 'backend', 'base_model', 'static', 'plots')
os.makedirs(PLOTS_DIR, exist_ok=True)

class PredictRequest(BaseModel):
    csv_path: str  # path on server where CSV dataset is located

@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now().isoformat()}

@app.post("/train")
def train_disabled():
    # Training is disabled for immutable base model
    raise HTTPException(status_code=403, detail="Training disabled for the base (immutable) model")

@app.post("/predict")
def start_prediction(req: PredictRequest):
    """
    Start a background prediction job using the provided csv_path.
    Returns a job_id which can be polled via /jobs/{job_id}/status
    """
    csv_path = req.csv_path
    # Basic validation of path - allow relative paths by resolving from PROJECT_ROOT
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(PROJECT_ROOT, csv_path)

    job_id = str(uuid.uuid4())
    JOB_STORE[job_id] = {
        "status": "PENDING",
        "started_at": datetime.now().isoformat(),
        "finished_at": None,
        "result": None,
        "error": None
    }

    def _run_job(job_id_local: str, csv_path_local: str):
        JOB_STORE[job_id_local]["status"] = "RUNNING"
        try:
            res = predict_model(csv_path_local)
            JOB_STORE[job_id_local]["result"] = res
            JOB_STORE[job_id_local]["status"] = "COMPLETED"
            JOB_STORE[job_id_local]["finished_at"] = datetime.now().isoformat()
        except Exception as e:
            JOB_STORE[job_id_local]["status"] = "FAILED"
            JOB_STORE[job_id_local]["error"] = {
                "message": str(e),
                "traceback": traceback.format_exc()
            }
            JOB_STORE[job_id_local]["finished_at"] = datetime.now().isoformat()

    # run in a thread (background task)
    thread = threading.Thread(target=_run_job, args=(job_id, csv_path), daemon=True)
    thread.start()

    return {"job_id": job_id, "status": "PENDING"}

@app.get("/jobs/{job_id}/status")
def job_status(job_id: str):
    job = JOB_STORE.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job ID not found")

    # If job completed successfully, return result structure
    if job["status"] == "COMPLETED":
        return {
            "status": job["status"],
            "started_at": job["started_at"],
            "finished_at": job["finished_at"],
            "result": job["result"]
        }
    elif job["status"] == "FAILED":
        return {
            "status": job["status"],
            "started_at": job["started_at"],
            "finished_at": job["finished_at"],
            "error": job["error"]
        }
    else:
        # PENDING or RUNNING
        return {
            "status": job["status"],
            "started_at": job["started_at"],
            "finished_at": job["finished_at"]
        }

@app.get("/models/list")
def models_list():
    # Static metadata for the immutable base model
    return {
        "models": [
            {
                "name": "randomforest_tess_base",
                "version": "1.0.0",
                "source": "classical_model/base_model/rf_pipeline_optuna.joblib",
                "accuracy": None,  # placeholder, can be filled from stored training metadata
                "retrainable": False,
                "description": "Immutable RandomForest model trained on tess.csv. Prediction-only."
            }
        ]
    }
