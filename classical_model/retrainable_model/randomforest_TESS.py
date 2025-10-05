# exoseekr/classical_model/retrainable_model/randomforest_TESS.py
import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from joblib import dump, load
from typing import Optional, Dict, Any
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE
from sklearn.metrics import (
    roc_auc_score, average_precision_score, accuracy_score,
    f1_score, confusion_matrix, roc_curve, precision_recall_curve
)
import matplotlib.pyplot as plt
import optuna

RANDOM_STATE = 42
MAX_N_TRIALS = 200  # safety cap for API

# -------------------
# Helper functions
# -------------------
def map_labels(series: pd.Series) -> pd.Series:
    """
    Map TFOPWG labels to binary targets. Drops PC/APC (NaN).
    Returns a pd.Series aligned to original index with NaNs dropped.
    """
    mapping = {"CP": 1, "KP": 1, "FP": 0, "FA": 0, "PC": np.nan, "APC": np.nan}
    mapped = series.astype(str).str.upper().map(mapping)
    return mapped.dropna()

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineered features (kept consistent with base model).
    - multiplicity via 'tid'
    - relative uncertainties for *_err1 & *_err2
    - is_limited_* flags for *_lim columns
    - several derived ratio features (if base cols exist)
    """
    df = df.copy()

    # multiplicity
    if 'tid' in df.columns:
        multiplicity = df['tid'].value_counts()
        df['multiplicity'] = df['tid'].map(multiplicity)

    # relative uncertainties and _lim flags
    for col in list(df.columns):
        if col.endswith("err1") and (col[:-4] + "err2") in df.columns and (col[:-4]) in df.columns:
            base = col[:-4]
            val = df[base].replace(0, np.nan).abs()
            df[f"relative_uncertainty_{base}"] = (
                df.get(base + 'err1', 0).abs() + df.get(base + 'err2', 0).abs()
            ) / (2 * val)

        if col.endswith("lim"):
            base = col[:-3]
            df[f"is_limited_{base}"] = (df[col].fillna(0) != 0).astype(int)

    def safe_div(a, b):
        with np.errstate(divide='ignore', invalid='ignore'):
            r = a / b
            if isinstance(r, pd.Series):
                return r.replace([np.inf, -np.inf], np.nan)
            return np.nan

    derived_features = {
        'transit_snr': ('pl_trandep', lambda d: safe_div(d['pl_trandep'], np.sqrt(d['pl_trandurh'])) if 'pl_trandep' in d and 'pl_trandurh' in d else None),
        'planet_star_radius_ratio': ('pl_rade', lambda d: safe_div(d['pl_rade'], d['st_rad']) if 'pl_rade' in d and 'st_rad' in d else None),
        'flux_temp_ratio': ('pl_insol', lambda d: safe_div(d['pl_insol'], d['st_teff']) if 'pl_insol' in d and 'st_teff' in d else None),
        'period_over_duration': ('pl_orbper', lambda d: safe_div(d['pl_orbper'], d['pl_trandurh']) if 'pl_orbper' in d and 'pl_trandurh' in d else None),
        'depth_over_tmag': ('pl_trandep', lambda d: safe_div(d['pl_trandep'], d['st_tmag']) if 'pl_trandep' in d and 'st_tmag' in d else None),
        'transit_shape_proxy': ('pl_trandurh', lambda d: safe_div(d['pl_trandurh'], d['pl_orbper']) if 'pl_trandurh' in d and 'pl_orbper' in d else None)
    }

    for name, (ref, func) in derived_features.items():
        try:
            if ref in df.columns:
                val = func(df)
                if val is not None:
                    df[name] = val
        except Exception:
            pass

    return df

def build_pipeline():
    return ImbPipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
        ('smote', SMOTE(random_state=RANDOM_STATE)),
        ('rf', RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1))
    ])

def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def _ts_now() -> str:
    return datetime.now().strftime("%Y%m%dT%H%M%S")

def _to_native(obj):
    """
    Convert numpy types to Python native types recursively for JSON serializability.
    """
    if isinstance(obj, np.generic):
        return obj.item()
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (list, tuple)):
        return [_to_native(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _to_native(v) for k, v in obj.items()}
    return obj

# -------------------
# Training function
# -------------------
def train_model(
    csv_path: str,
    n_trials: int = 50,
    hyperparameters: Optional[Dict[str, Any]] = None,
    out_dir: str = "models",
    plot_dir: str = "../../backend/retrainable_model/static/plots"
) -> Dict[str, Any]:
    """
    Train a RandomForest pipeline. If hyperparameters provided, skip Optuna.
    Saves:
      - model to classical_model/retrainable_model/<out_dir>/rf_pipeline_optuna_<TS>.joblib
      - metadata JSON next to the model: rf_pipeline_optuna_<TS>.meta.json
      - plots to backend/retrainable_model/static/plots/
    Returns JSON-serializable dict with status, model_path (relative to project root), metrics, plots, best_params.
    """

    # Resolve paths relative to this file (project root = two levels up)
    this_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(this_dir, '..', '..'))  # exoseekr/
    # Model out dir inside classical_model/retrainable_model/
    model_out_dir = os.path.join(project_root, 'classical_model', 'retrainable_model', out_dir)
    plots_dir = os.path.join(project_root, 'backend', 'retrainable_model', 'static', 'plots')

    _ensure_dir(model_out_dir)
    _ensure_dir(plots_dir)

    # Safety cap for n_trials
    if n_trials is None:
        n_trials = 50
    if n_trials > MAX_N_TRIALS:
        raise ValueError(f"n_trials too large ({n_trials}) - API limit is {MAX_N_TRIALS}")

    # Validate files
    if not os.path.exists(csv_path):
        # allow relative path from project root
        candidate = os.path.join(project_root, csv_path)
        if os.path.exists(candidate):
            csv_path = candidate
        else:
            raise FileNotFoundError(f"Training CSV not found at: {csv_path}")

    # Load data
    df = pd.read_csv(csv_path)
    if df.empty:
        raise ValueError("Input CSV is empty.")

    if 'tfopwg_disp' not in df.columns:
        raise ValueError("Training CSV must contain 'tfopwg_disp' for supervised training.")

    # Map labels and align dataframe
    y = map_labels(df['tfopwg_disp'])
    df = df.loc[y.index].copy()

    # Feature engineering
    X = engineer_features(df)

    # Drop columns excluded during training (best-effort)
    cols_to_drop = [
        'tfopwg_disp', 'toi', 'tid', 'rastr', 'decstr', 'toi_created', 'rowupdate',
        'st_pmraerr1', 'st_pmraerr2', 'st_pmdecerr1', 'st_pmdecerr2',
        'pl_tranmiderr1', 'pl_tranmiderr2', 'pl_orbpererr1', 'pl_orbpererr2',
        'pl_trandurherr1', 'pl_trandurherr2', 'pl_trandeperr1', 'pl_trandeperr2',
        'pl_radeerr1', 'pl_radeerr2', 'pl_insolerr1', 'pl_insolerr2',
        'pl_eqterr1', 'pl_eqterr2', 'st_tmagerr1', 'st_tmagerr2',
        'st_disterr1', 'st_disterr2', 'st_tefferr1', 'st_tefferr2',
        'st_loggerr1', 'st_loggerr2', 'st_raderr1', 'st_raderr2',
        'st_pmralim', 'st_pmdeclim', 'pl_tranmidlim', 'pl_orbperlim',
        'pl_trandurhlim', 'pl_trandeplim', 'pl_radelim', 'pl_insollim',
        'pl_eqtlim', 'st_tmaglim', 'st_distlim', 'st_tefflim',
        'st_logglim', 'st_radlim'
    ]
    X = X.drop(columns=cols_to_drop, errors='ignore')

    numeric_cols = X.select_dtypes(include=[np.number]).columns
    X = X[numeric_cols].copy()
    X = X.dropna(axis=1, how='all')

    if X.shape[0] == 0 or X.shape[1] == 0:
        raise ValueError("No usable numeric features after preprocessing.")

    # train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    # Objective for Optuna
    def objective(trial):
        n_estimators = trial.suggest_int('n_estimators', 100, 800)
        max_depth = trial.suggest_categorical('max_depth', [None, 10, 20, 30, 40])
        min_samples_split = trial.suggest_int('min_samples_split', 2, 15)
        max_features = trial.suggest_categorical('max_features', ['sqrt', 'log2'])
        pipeline = build_pipeline()
        pipeline.set_params(
            rf__n_estimators=n_estimators,
            rf__max_depth=max_depth,
            rf__min_samples_split=min_samples_split,
            rf__max_features=max_features
        )
        # quick cross-val on training set
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE)
        scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='average_precision', n_jobs=-1)
        return float(np.mean(scores))

    best_params = None
    if hyperparameters:
        # hyperparameters expected in the rf__... or plain keys; normalize expected rf params
        best_params = {}
        # Accept both "n_estimators" and "rf__n_estimators" style keys
        for k, v in hyperparameters.items():
            if k.startswith("rf__") or k.startswith("rf."):
                best_params[k.replace('.', '__')] = v
            else:
                # assume plain rf param -> prefix with rf__
                best_params[f"rf__{k}"] = v

        pipeline = build_pipeline()
        pipeline.set_params(**best_params)
        pipeline.fit(X_train, y_train)
    else:
        # Run Optuna
        optuna.logging.set_verbosity(optuna.logging.WARNING)
        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
        opt_best = study.best_params
        # Convert optuna keys to pipeline param names (rf__...)
        # (opt_best currently contains plain names used in objective)
        best_params = {
            'rf__n_estimators': int(opt_best['n_estimators']),
            'rf__max_depth': None if opt_best['max_depth'] is None else int(opt_best['max_depth']),
            'rf__min_samples_split': int(opt_best['min_samples_split']),
            'rf__max_features': opt_best['max_features']
        }
        pipeline = build_pipeline()
        pipeline.set_params(**best_params)
        pipeline.fit(X_train, y_train)

    # Predict on holdout set
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1] if hasattr(pipeline, "predict_proba") else np.array(y_pred, dtype=float)

    # Compute metrics
    try:
        roc = float(roc_auc_score(y_test, y_prob))
    except Exception:
        roc = None
    try:
        pr = float(average_precision_score(y_test, y_prob))
    except Exception:
        pr = None
    try:
        acc = float(accuracy_score(y_test, y_pred))
    except Exception:
        acc = None
    try:
        f1 = float(f1_score(y_test, y_pred))
    except Exception:
        f1 = None
    try:
        cm = confusion_matrix(y_test, y_pred).tolist()
    except Exception:
        cm = None

    metrics = {
        "roc_auc": roc,
        "pr_auc": pr,
        "accuracy": acc,
        "f1_score": f1,
        "confusion_matrix": cm
    }

    # Save model artifact with timestamped filename inside model_out_dir
    ts = _ts_now()
    model_filename = f"rf_pipeline_optuna_{ts}.joblib"
    model_path = os.path.join(model_out_dir, model_filename)
    dump(pipeline, model_path)

    # Save metadata JSON next to model
    meta = {
        "created_at": ts,
        "model_filename": model_filename,
        "model_path": os.path.relpath(model_path, start=project_root),
        "metrics": _to_native(metrics),
        "best_params": _to_native(best_params),
        "train_data": os.path.relpath(csv_path, start=project_root),
        "retrainable": True
    }
    meta_path = model_path.replace(".joblib", ".meta.json")
    with open(meta_path, "w") as fh:
        json.dump(meta, fh, indent=2)

    # Feature importances (if accessible)
    importances = None
    try:
        rf = None
        if hasattr(pipeline, 'named_steps') and 'rf' in pipeline.named_steps:
            rf = pipeline.named_steps['rf']
        elif hasattr(pipeline, 'steps'):
            rf = pipeline.steps[-1][1]
        if rf is not None and hasattr(rf, "feature_importances_"):
            fi = np.array(rf.feature_importances_)
            if fi.shape[0] == X_train.shape[1]:
                importances = pd.Series(fi, index=X_train.columns).sort_values(ascending=False)
            else:
                importances = pd.Series(fi).sort_values(ascending=False)
    except Exception:
        importances = None

    # Save plots (ROC, PR, Importances) with timestamps in plots_dir
    plots = {"roc": None, "pr": None, "importances": None}
    try:
        # ROC
        if metrics["roc_auc"] is not None:
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            roc_fn = os.path.join(plots_dir, f"roc_{ts}.png")
            plt.figure()
            plt.plot(fpr, tpr, label=f"ROC (AUC={metrics['roc_auc']:.3f})")
            plt.plot([0, 1], [0, 1], 'k--')
            plt.xlabel("False Positive Rate")
            plt.ylabel("True Positive Rate")
            plt.title("ROC Curve")
            plt.legend()
            plt.tight_layout()
            plt.savefig(roc_fn)
            plt.close()
            plots["roc"] = os.path.relpath(roc_fn, start=project_root)
    except Exception:
        plots["roc"] = None

    try:
        # Precision-Recall
        if metrics["pr_auc"] is not None:
            precision, recall, _ = precision_recall_curve(y_test, y_prob)
            pr_fn = os.path.join(plots_dir, f"pr_{ts}.png")
            plt.figure()
            plt.plot(recall, precision, label=f"PR (AUC={metrics['pr_auc']:.3f})")
            plt.xlabel("Recall")
            plt.ylabel("Precision")
            plt.title("Precision-Recall Curve")
            plt.legend()
            plt.tight_layout()
            plt.savefig(pr_fn)
            plt.close()
            plots["pr"] = os.path.relpath(pr_fn, start=project_root)
    except Exception:
        plots["pr"] = None

    try:
        # Feature importances
        if importances is not None and not importances.empty:
            imp_fn = os.path.join(plots_dir, f"importances_{ts}.png")
            top20 = importances.head(20)
            plt.figure(figsize=(8, 6))
            top20.sort_values().plot(kind="barh")
            plt.title("Top 20 Feature Importances")
            plt.xlabel("Importance")
            plt.tight_layout()
            plt.savefig(imp_fn)
            plt.close()
            plots["importances"] = os.path.relpath(imp_fn, start=project_root)
    except Exception:
        plots["importances"] = None

    result = {
        "status": "success",
        "model_path": os.path.relpath(model_path, start=project_root),
        "metrics": _to_native(metrics),
        "plots": plots,
        "best_params": _to_native(best_params),
        "metadata_path": os.path.relpath(meta_path, start=project_root)
    }

    return result

# -------------------
# Prediction function
# -------------------
def predict_model(
    model_path: Optional[str],
    csv_path: str,
    threshold: float = 0.5
) -> Dict[str, Any]:
    """
    Predict with a retrainable model.
    - If model_path is None or empty -> choose newest rf_pipeline_optuna_*.joblib in classical_model/retrainable_model/
    - Preprocess CSV using engineer_features(), produce predictions, metrics (if labels present), and save plots to backend/retrainable_model/static/plots/
    - Returns dict with total_samples, exoplanets_detected, predictions (index, transit_detected (bool), confidence), metrics (if available), plots, model_info
    """
    this_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(this_dir, '..', '..'))  # exoseekr/
    models_dir = os.path.join(project_root, 'classical_model', 'retrainable_model')
    plots_dir = os.path.join(project_root, 'backend', 'retrainable_model', 'static', 'plots')

    _ensure_dir(plots_dir)

    # Resolve CSV path
    if not os.path.exists(csv_path):
        candidate = os.path.join(project_root, csv_path)
        if os.path.exists(candidate):
            csv_path = candidate
        else:
            raise FileNotFoundError(f"CSV for prediction not found at: {csv_path}")

    # Resolve model_path: if None -> pick newest rf_pipeline_optuna_*.joblib
    chosen_model_path = None
    if model_path and model_path.strip():
        candidate = model_path
        if not os.path.isabs(candidate):
            candidate = os.path.join(project_root, candidate)
        if not os.path.exists(candidate):
            raise FileNotFoundError(f"Model not found at: {model_path}")
        chosen_model_path = candidate
    else:
        # list timestamped joblib files
        files = [f for f in os.listdir(models_dir) if f.startswith("rf_pipeline_optuna_") and f.endswith(".joblib")]
        if not files:
            raise FileNotFoundError("No retrainable model artifacts found in classical_model/retrainable_model/. Provide model_path or train a model first.")
        # choose latest by filename (timestamp in name)
        files_sorted = sorted(files, reverse=True)
        chosen_model_path = os.path.join(models_dir, files_sorted[0])

    # Load model
    pipeline = load(chosen_model_path)

    # Load CSV & preprocess
    df = pd.read_csv(csv_path)
    if df.empty:
        raise ValueError("Input CSV is empty.")

    y = None
    if 'tfopwg_disp' in df.columns:
        try:
            y = map_labels(df['tfopwg_disp'])
            df = df.loc[y.index].copy()
        except Exception:
            y = None

    X = engineer_features(df)
    cols_to_drop = [
        'tfopwg_disp', 'toi', 'tid', 'rastr', 'decstr', 'toi_created', 'rowupdate'
    ]
    X = X.drop(columns=cols_to_drop, errors='ignore')
    numeric_cols = X.select_dtypes(include=[np.number]).columns
    X = X[numeric_cols].copy()
    X = X.dropna(axis=1, how='all')

    total_samples = int(X.shape[0])
    if total_samples == 0:
        raise ValueError("No usable numeric features found after preprocessing.")

    # Predict
    preds = pipeline.predict(X)
    probs = pipeline.predict_proba(X)[:, 1] if hasattr(pipeline, "predict_proba") else np.array(preds, dtype=float)

    # Assemble predictions list
    predictions = []
    detected = 0
    for i, (p, prob) in enumerate(zip(preds, probs)):
        detected_flag = bool(int(p) >= 1 and prob >= threshold)  # but keep p as predicted class
        if p == 1:
            detected += 1
        predictions.append({
            "index": int(X.index[i]),
            "transit_detected": bool(int(p) == 1),
            "confidence": float(prob)
        })

    # Metrics if labels present
    metrics = None
    if y is not None:
        y_aligned = y.loc[X.index]
        try:
            roc = float(roc_auc_score(y_aligned, probs))
        except Exception:
            roc = None
        try:
            pr = float(average_precision_score(y_aligned, probs))
        except Exception:
            pr = None
        try:
            acc = float(accuracy_score(y_aligned, preds))
        except Exception:
            acc = None
        try:
            f1 = float(f1_score(y_aligned, preds))
        except Exception:
            f1 = None
        try:
            cm = confusion_matrix(y_aligned, preds).tolist()
        except Exception:
            cm = None

        metrics = {
            "roc_auc": roc,
            "pr_auc": pr,
            "accuracy": acc,
            "f1_score": f1,
            "confusion_matrix": cm
        }

    # Feature importances if available
    importances = None
    try:
        rf = None
        if hasattr(pipeline, 'named_steps') and 'rf' in pipeline.named_steps:
            rf = pipeline.named_steps['rf']
        elif hasattr(pipeline, 'steps'):
            rf = pipeline.steps[-1][1]
        if rf is not None and hasattr(rf, "feature_importances_"):
            fi = np.array(rf.feature_importances_)
            if fi.shape[0] == X.shape[1]:
                importances = pd.Series(fi, index=X.columns).sort_values(ascending=False)
            else:
                importances = pd.Series(fi).sort_values(ascending=False)
    except Exception:
        importances = None

    # Save plots with timestamp
    ts = _ts_now()
    plots = {"roc": None, "pr": None, "importances": None}
    try:
        if metrics and metrics.get("roc_auc") is not None:
            fpr, tpr, _ = roc_curve(y_aligned, probs)
            roc_fn = os.path.join(plots_dir, f"roc_{ts}.png")
            plt.figure()
            plt.plot(fpr, tpr, label=f"ROC (AUC={metrics['roc_auc']:.3f})")
            plt.plot([0, 1], [0, 1], 'k--')
            plt.xlabel("False Positive Rate")
            plt.ylabel("True Positive Rate")
            plt.title("ROC Curve")
            plt.legend()
            plt.tight_layout()
            plt.savefig(roc_fn)
            plt.close()
            plots["roc"] = os.path.relpath(roc_fn, start=project_root)
    except Exception:
        plots["roc"] = None

    try:
        if metrics and metrics.get("pr_auc") is not None:
            precision, recall, _ = precision_recall_curve(y_aligned, probs)
            pr_fn = os.path.join(plots_dir, f"pr_{ts}.png")
            plt.figure()
            plt.plot(recall, precision, label=f"PR (AUC={metrics['pr_auc']:.3f})")
            plt.xlabel("Recall")
            plt.ylabel("Precision")
            plt.title("Precision-Recall Curve")
            plt.legend()
            plt.tight_layout()
            plt.savefig(pr_fn)
            plt.close()
            plots["pr"] = os.path.relpath(pr_fn, start=project_root)
    except Exception:
        plots["pr"] = None

    try:
        if importances is not None and not importances.empty:
            imp_fn = os.path.join(plots_dir, f"importances_{ts}.png")
            top20 = importances.head(20)
            plt.figure(figsize=(8, 6))
            top20.sort_values().plot(kind="barh")
            plt.title("Top 20 Feature Importances")
            plt.xlabel("Importance")
            plt.tight_layout()
            plt.savefig(imp_fn)
            plt.close()
            plots["importances"] = os.path.relpath(imp_fn, start=project_root)
    except Exception:
        plots["importances"] = None

    result = {
        "total_samples": int(total_samples),
        "exoplanets_detected": int(detected),
        "predictions": predictions,
        "metrics": _to_native(metrics) if metrics is not None else None,
        "plots": plots,
        "model_info": {
            "source": os.path.relpath(chosen_model_path, start=project_root),
            "train_data": None,
            "retrainable": True
        }
    }

    # attempt to populate train_data / metadata if .meta.json exists
    try:
        meta_candidate = chosen_model_path.replace(".joblib", ".meta.json")
        if os.path.exists(meta_candidate):
            with open(meta_candidate, "r") as fh:
                meta = json.load(fh)
            result["model_info"]["train_data"] = meta.get("train_data")
    except Exception:
        pass

    return result

