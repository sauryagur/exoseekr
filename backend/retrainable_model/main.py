# exoseekr/backend/retrainable_model/main.py
import os
import uuid
import threading
import traceback
import json
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

# Import train/predict functions from the retrainable model module
from classical_model.retrainable_model.randomforest_TESS import train_model, predict_model

app = FastAPI(title="ExoSeekr — Retrainable Model")

# Simple in-memory job store (for demo usage)
# job_id -> {status, started_at, finished_at, result, error}
JOB_STORE: Dict[str, Dict[str, Any]] = {}

# Project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# Ensure plots dir exists
PLOTS_DIR = os.path.join(PROJECT_ROOT, 'backend', 'retrainable_model', 'static', 'plots')
os.makedirs(PLOTS_DIR, exist_ok=True)

# Ensure model directory exists
MODELS_DIR = os.path.join(PROJECT_ROOT, 'classical_model', 'retrainable_model')
os.makedirs(MODELS_DIR, exist_ok=True)

# ---- Pydantic request models ----
class TrainRequest(BaseModel):
    data_source: str
    n_trials: Optional[int] = 50
    hyperparameters: Optional[Dict[str, Any]] = None
    out_dir: Optional[str] = "models"

class PredictRequest(BaseModel):
    data_source: str
    model_path: Optional[str] = None
    threshold: Optional[float] = 0.5

# ---- Helpers ----
def _make_job() -> str:
    job_id = str(uuid.uuid4())
    JOB_STORE[job_id] = {
        "status": "PENDING",
        "started_at": None,
        "finished_at": None,
        "result": None,
        "error": None
    }
    return job_id

def _update_job_running(job_id: str):
    JOB_STORE[job_id]["status"] = "RUNNING"
    JOB_STORE[job_id]["started_at"] = datetime.now().isoformat()

def _update_job_success(job_id: str, result: Dict[str, Any]):
    JOB_STORE[job_id]["status"] = "COMPLETED"
    JOB_STORE[job_id]["finished_at"] = datetime.now().isoformat()
    JOB_STORE[job_id]["result"] = result

def _update_job_failed(job_id: str, exc: Exception):
    JOB_STORE[job_id]["status"] = "FAILED"
    JOB_STORE[job_id]["finished_at"] = datetime.now().isoformat()
    JOB_STORE[job_id]["error"] = {
        "message": str(exc),
        "traceback": traceback.format_exc()
    }

# ---- API Endpoints ----
@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now().isoformat()}

@app.post("/train")
def start_train(req: TrainRequest):
    """
    Starts a background training job.
    Returns: { "job_id": "<uuid>" }
    """
    # resolve data_source relative to project root if not absolute
    csv_path = req.data_source
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(PROJECT_ROOT, csv_path)

    # quick file existence check - don't block if big but fail-fast
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=400, detail=f"Training CSV not found at: {req.data_source}")

    # enforce n_trials limit
    n_trials = req.n_trials or 50
    from classical_model.retrainable_model.randomforest_TESS import MAX_N_TRIALS
    if n_trials > MAX_N_TRIALS:
        raise HTTPException(status_code=400, detail=f"n_trials too large ({n_trials}); max allowed is {MAX_N_TRIALS}")

    job_id = _make_job()

    def _train_job(job_id_local: str, csv_local: str, n_trials_local: int, hyperparams_local: Optional[Dict[str, Any]], out_dir_local: str):
        try:
            _update_job_running(job_id_local)
            result = train_model(
                csv_path=csv_local,
                n_trials=n_trials_local,
                hyperparameters=hyperparams_local,
                out_dir=out_dir_local,
                plot_dir="../../backend/retrainable_model/static/plots"  # train_model handles plot_dir relative resolution
            )
            _update_job_success(job_id_local, result)
        except Exception as e:
            _update_job_failed(job_id_local, e)

    thread = threading.Thread(
        target=_train_job,
        args=(job_id, csv_path, n_trials, req.hyperparameters, req.out_dir),
        daemon=True
    )
    thread.start()
    return {"job_id": job_id}

@app.post("/predict")
def start_predict(req: PredictRequest):
    """
    Starts a background prediction job.
    If model_path is empty, the predict_model function will pick the newest model.
    """
    csv_path = req.data_source
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(PROJECT_ROOT, csv_path)

    if not os.path.exists(csv_path):
        raise HTTPException(status_code=400, detail=f"Prediction CSV not found at: {req.data_source}")

    job_id = _make_job()

    def _predict_job(job_id_local: str, csv_local: str, model_path_local: Optional[str], threshold_local: float):
        try:
            _update_job_running(job_id_local)
            res = predict_model(model_path_local, csv_local, threshold_local)
            _update_job_success(job_id_local, res)
        except Exception as e:
            _update_job_failed(job_id_local, e)

    thread = threading.Thread(
        target=_predict_job,
        args=(job_id, csv_path, req.model_path, req.threshold),
        daemon=True
    )
    thread.start()
    return {"job_id": job_id}

@app.get("/jobs/{job_id}/status")
def job_status(job_id: str):
    job = JOB_STORE.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job ID not found")
    return job

@app.get("/models/list")
def models_list():
    """
    Return a list of saved retrainable models. Reads .meta.json if present to include metrics/created_at.
    """
    models_dir = os.path.join(PROJECT_ROOT, 'classical_model', 'retrainable_model')
    files = [f for f in os.listdir(models_dir) if f.startswith("rf_pipeline_optuna_") and f.endswith(".joblib")]
    models = []
    for fname in sorted(files, reverse=True):
        full = os.path.join(models_dir, fname)
        rel = os.path.relpath(full, start=PROJECT_ROOT)
        meta_path = full.replace(".joblib", ".meta.json")
        meta = None
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r") as fh:
                    meta = json.load(fh)
            except Exception:
                meta = None
        item = {
            "model_filename": fname,
            "path": rel,
            "created_at": meta.get("created_at") if meta else None,
            "retrainable": True,
            "metrics": meta.get("metrics") if meta else None,
            "best_params": meta.get("best_params") if meta else None,
            "metadata_path": os.path.relpath(meta_path, start=PROJECT_ROOT) if os.path.exists(meta_path) else None
        }
        models.append(item)
    return {"models": models}

@app.get("/models/{model_filename}/metadata")
def model_metadata(model_filename: str):
    """
    Return metadata JSON for a specific model filename (if exists).
    """
    models_dir = os.path.join(PROJECT_ROOT, 'classical_model', 'retrainable_model')
    full = os.path.join(models_dir, model_filename)
    if not os.path.exists(full):
        raise HTTPException(status_code=404, detail="Model not found")
    meta_path = full.replace(".joblib", ".meta.json")
    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Metadata file not found for model")
    with open(meta_path, "r") as fh:
        meta = json.load(fh)
    return meta

