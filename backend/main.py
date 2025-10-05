# exoseekr/backend/main.py
"""
Unified FastAPI entrypoint for ExoSeekr.
Integrates:
 - Base Model (Immutable)
 - Retrainable Model (Mutable)
so both can run under a single backend instance (port 8000).
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import both sub-apps
from backend.base_model.main import app as base_app
from backend.retrainable_model.main import app as retrainable_app

# ----------------------------------------------------------
# Unified FastAPI app
# ----------------------------------------------------------
app = FastAPI(title="ExoSeekr Unified Backend")

# ----------------------------------------------------------
# CORS (Frontend integration)
# ----------------------------------------------------------
# Allow access from frontend (Next.js) running on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # can be restricted to ["http://localhost:3000"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------
# Mount Sub-Applications
# ----------------------------------------------------------
# Each sub-application maintains its own routes and job store.

# Immutable Base Model (Predict-only)
app.mount("/base", base_app)

# Retrainable Model (Train + Predict)
app.mount("/retrainable", retrainable_app)


# ----------------------------------------------------------
# Root-level routes
# ----------------------------------------------------------
@app.get("/")
def index():
    return {
        "message": "Welcome to ExoSeekr Unified API",
        "endpoints": {
            "health": "/health",
            "base_model": {
                "predict": "/base/predict",
                "jobs_status": "/base/jobs/{job_id}/status",
                "models_list": "/base/models/list",
            },
            "retrainable_model": {
                "train": "/retrainable/train",
                "predict": "/retrainable/predict",
                "jobs_status": "/retrainable/jobs/{job_id}/status",
                "models_list": "/retrainable/models/list",
            },
        },
    }

@app.get("/health")
def health():
    return {"status": "ok", "message": "Unified backend running"}


# ----------------------------------------------------------
# Application entrypoint (for Uvicorn / PM2)
# ----------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

