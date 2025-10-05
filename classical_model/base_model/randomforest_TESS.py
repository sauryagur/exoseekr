# exoseekr/classical_model/base_model/randomforest_TESS.py
import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from joblib import load
from sklearn.metrics import (
    roc_auc_score, average_precision_score, accuracy_score,
    f1_score, confusion_matrix, roc_curve, precision_recall_curve
)
import matplotlib.pyplot as plt

RANDOM_STATE = 42

def map_labels(series: pd.Series) -> pd.Series:
    """
    Maps TFOPWG disposition labels to binary classes:
      - 'CP' and 'KP' => 1 (planet)
      - 'FP' and 'FA' => 0 (not planet)
      - 'PC','APC' => treated as unknown/NaN and dropped
    Returns a series with original index preserved and NaNs removed.
    """
    mapping = {"CP": 1, "KP": 1, "FP": 0, "FA": 0, "PC": np.nan, "APC": np.nan}
    mapped = series.astype(str).str.upper().map(mapping)
    return mapped.dropna()

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Feature engineering adapted from training script:
    - multiplicity from 'tid'
    - relative_uncertainty for fields with err1/err2
    - is_limited_* flags for columns ending with 'lim'
    - derived numerical features (safe_div) if referenced columns exist
    Returns a new DataFrame with engineered columns appended.
    """
    df = df.copy()

    # multiplicity feature
    if 'tid' in df.columns:
        multiplicity = df['tid'].value_counts()
        df['multiplicity'] = df['tid'].map(multiplicity)

    # relative uncertainties for *_err1 & *_err2
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
            # replace inf/-inf with nan
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
            # be permissive — don't fail engineering
            pass

    return df

def _ensure_plots_dir(plots_dir: str):
    if not os.path.exists(plots_dir):
        os.makedirs(plots_dir, exist_ok=True)

def _timestamped_filename(prefix: str, ext: str = ".png") -> str:
    return f"{prefix}_{datetime.now().strftime('%Y%m%dT%H%M%S')}{ext}"

def predict_model(csv_path: str):
    """
    Load pre-trained model, preprocess CSV at csv_path, run predictions,
    compute metrics (if labels present), save plots, and return a JSON-serializable dict.

    Expected pre-trained model location (relative to project root):
      classical_model/base_model/rf_pipeline_optuna.joblib

    Plots are written to:
      backend/base_model/static/plots/

    Returns: dict with required fields.
    """
    # determine project root (two levels above this file: exoseekr/)
    this_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(this_dir, '..', '..'))  # exoseekr/
    model_path = os.path.join(project_root, 'classical_model', 'base_model', 'rf_pipeline_optuna.joblib')
    plots_dir = os.path.join(project_root, 'backend', 'base_model', 'static', 'plots')

    # prepare results container
    results = {
        "total_samples": 0,
        "exoplanets_detected": 0,
        "predictions": [],
        "metrics": None,
        "plots": {},
        "model_info": {
            "source": "classical_model/base_model/rf_pipeline_optuna.joblib",
            "train_data": "tess.csv",
            "retrainable": False
        }
    }

    # validate model artifact
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Pre-trained model not found at: {model_path}")

    # validate input CSV
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Input CSV not found at: {csv_path}")

    # load model
    pipeline = load(model_path)

    # load data
    df = pd.read_csv(csv_path)
    if df.empty:
        raise ValueError("Input CSV is empty.")

    # attempt to extract labels if present
    y = None
    if 'tfopwg_disp' in df.columns:
        try:
            y = map_labels(df['tfopwg_disp'])
            # align rows in df to y's index (drop rows with unknown labels)
            df = df.loc[y.index].copy()
        except Exception:
            y = None

    # feature engineering
    X = engineer_features(df)

    # drop columns that were excluded during training (best effort)
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

    # keep numeric columns only (pipeline expected numeric)
    numeric_cols = X.select_dtypes(include=[np.number]).columns
    X = X[numeric_cols]
    # drop all-nan columns
    X = X.dropna(axis=1, how='all')

    # final counts
    results['total_samples'] = int(X.shape[0])
    if results['total_samples'] == 0:
        raise ValueError("No usable numeric features found after preprocessing.")

    # ensure plots dir exists
    _ensure_plots_dir(plots_dir)

    # predict
    try:
        preds = pipeline.predict(X)
        probs = pipeline.predict_proba(X)[:, 1] if hasattr(pipeline, "predict_proba") else np.array([float(p) for p in pipeline.predict(X)])
    except ValueError as e:
        # feature mismatch or other issues
        raise ValueError(f"Model prediction failed: {str(e)}")

    # assemble prediction list
    pred_list = []
    detected = 0
    for idx, (p, prob) in enumerate(zip(preds, probs)):
        p_int = int(p)
        prob_val = float(prob)
        pred_list.append({"index": int(X.index[idx]), "prediction": p_int, "confidence": prob_val})
        if p_int == 1:
            detected += 1

    results['predictions'] = pred_list
    results['exoplanets_detected'] = int(detected)

    # compute metrics if labels available
    if y is not None:
        # y should align with X index
        y_aligned = y.loc[X.index]
        try:
            roc = roc_auc_score(y_aligned, probs)
        except Exception:
            roc = None
        try:
            pr = average_precision_score(y_aligned, probs)
        except Exception:
            pr = None
        try:
            acc = accuracy_score(y_aligned, preds)
        except Exception:
            acc = None
        try:
            f1 = f1_score(y_aligned, preds)
        except Exception:
            f1 = None
        try:
            cm = confusion_matrix(y_aligned, preds).tolist()
        except Exception:
            cm = None

        results['metrics'] = {
            "roc_auc": None if roc is None or np.isnan(roc) else float(roc),
            "pr_auc": None if pr is None or np.isnan(pr) else float(pr),
            "accuracy": None if acc is None or np.isnan(acc) else float(acc),
            "f1_score": None if f1 is None or np.isnan(f1) else float(f1),
            "confusion_matrix": cm
        }

    # FEATURE IMPORTANCES: try to map to X columns if possible
    importances = None
    try:
        rf = None
        # if pipeline is a sklearn Pipeline or imblearn Pipeline, try to access final estimator
        if hasattr(pipeline, 'named_steps') and 'rf' in pipeline.named_steps:
            rf = pipeline.named_steps['rf']
        else:
            # last estimator attribute - try typical pipeline API
            if hasattr(pipeline, 'steps'):
                last = pipeline.steps[-1][1]
                rf = last
            elif hasattr(pipeline, 'estimator'):
                rf = pipeline.estimator
        if rf is not None and hasattr(rf, "feature_importances_"):
            fi = np.array(rf.feature_importances_)
            # if lengths match, map to X.columns
            if fi.shape[0] == X.shape[1]:
                importances = pd.Series(fi, index=X.columns).sort_values(ascending=False)
            else:
                # fallback: return top features by index name if available
                importances = pd.Series(fi).sort_values(ascending=False)
    except Exception:
        importances = None

    # Plot ROC
    timestamp = datetime.now().strftime('%Y%m%dT%H%M%S')
    roc_fn = os.path.join(plots_dir, f"roc_{timestamp}.png")
    pr_fn = os.path.join(plots_dir, f"pr_{timestamp}.png")
    imp_fn = os.path.join(plots_dir, f"importances_{timestamp}.png")

    # ROC Curve
    try:
        if 'metrics' in results and results['metrics'] and results['metrics'].get('roc_auc') is not None:
            fpr, tpr, _ = roc_curve(y_aligned, probs)
            plt.figure()
            plt.plot(fpr, tpr, label=f"ROC Curve (AUC = {results['metrics']['roc_auc']:.3f})")
            plt.plot([0, 1], [0, 1], 'k--')
            plt.xlabel('False Positive Rate')
            plt.ylabel('True Positive Rate')
            plt.title('Receiver Operating Characteristic (ROC) Curve')
            plt.legend()
            plt.tight_layout()
            plt.savefig(roc_fn)
            plt.close()
            results['plots']['roc'] = os.path.relpath(roc_fn, start=project_root)
        else:
            # still attempt ROC with predictions if no labels -> can't draw ROC
            results['plots']['roc'] = None
    except Exception:
        results['plots']['roc'] = None

    # Precision-Recall Curve
    try:
        if 'metrics' in results and results['metrics'] and results['metrics'].get('pr_auc') is not None:
            precision, recall, _ = precision_recall_curve(y_aligned, probs)
            plt.figure()
            plt.plot(recall, precision, label=f"PR Curve (AUC = {results['metrics']['pr_auc']:.3f})")
            plt.xlabel('Recall')
            plt.ylabel('Precision')
            plt.title('Precision-Recall Curve')
            plt.legend()
            plt.tight_layout()
            plt.savefig(pr_fn)
            plt.close()
            results['plots']['pr'] = os.path.relpath(pr_fn, start=project_root)
        else:
            results['plots']['pr'] = None
    except Exception:
        results['plots']['pr'] = None

    # Feature Importances plot (top 20)
    try:
        if importances is not None and not importances.empty:
            # take top 20
            top20 = importances.head(20)
            plt.figure(figsize=(8, 6))
            # if index are strings, horizontal bar plot
            if top20.index.dtype == object or top20.index.dtype == 'O':
                top20.sort_values().plot(kind='barh')
            else:
                top20.sort_values().plot(kind='barh')
            plt.title('Top 20 Feature Importances')
            plt.xlabel('Importance')
            plt.tight_layout()
            plt.savefig(imp_fn)
            plt.close()
            results['plots']['importances'] = os.path.relpath(imp_fn, start=project_root)
        else:
            results['plots']['importances'] = None
    except Exception:
        results['plots']['importances'] = None

    return results

