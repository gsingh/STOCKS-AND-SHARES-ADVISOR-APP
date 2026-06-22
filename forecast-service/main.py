import os
import time
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("forecast-service")

MODEL_ID = os.getenv("TIMESFM_MODEL_ID", "google/timesfm-2.5-200m-pytorch")
MODEL_LOADED = False
model = None

torch.set_float32_matmul_precision("high")


class ForecastRequest(BaseModel):
    series: List[float] = Field(..., min_length=4, description="Historical price/values array")
    horizon: int = Field(default=30, ge=1, le=365, description="Number of future steps to predict")


class ForecastResponse(BaseModel):
    point: List[float]
    quantiles: dict = {}
    horizon: int
    model_version: str


class BatchForecastRequest(BaseModel):
    series_list: List[List[float]] = Field(..., description="List of historical price arrays")
    horizon: int = Field(default=30, ge=1, le=365)


class BatchForecastResponse(BaseModel):
    forecasts: List[ForecastResponse]
    elapsed_ms: float


def load_model():
    global model, MODEL_LOADED
    if MODEL_LOADED:
        return

    logger.info(f"Loading TimesFM model: {MODEL_ID}")
    t0 = time.time()

    import timesfm

    model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(MODEL_ID)
    model.compile(
        timesfm.ForecastConfig(
            max_context=1024,
            max_horizon=256,
            normalize_inputs=True,
            use_continuous_quantile_head=True,
            force_flip_invariance=True,
            infer_is_positive=True,
            fix_quantile_crossing=True,
        )
    )

    elapsed = time.time() - t0
    MODEL_LOADED = True
    logger.info(f"Model loaded in {elapsed:.1f}s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield


app = FastAPI(title="Forecast Service", version="2.5.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": MODEL_LOADED, "model": MODEL_ID}


@app.post("/forecast", response_model=ForecastResponse)
async def forecast(req: ForecastRequest):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model not yet loaded")

    t0 = time.time()
    arr = np.array(req.series, dtype=np.float32)

    point_forecast, quantile_forecast = model.forecast(
        horizon=req.horizon,
        inputs=[arr],
    )

    point = point_forecast[0].tolist()
    quantiles = {}

    if quantile_forecast is not None and quantile_forecast.ndim == 3:
        q_arr = quantile_forecast[0]  # shape: (horizon, 10)
        num_quantiles = q_arr.shape[1]
        if num_quantiles >= 9:
            labels = ["p10", "p20", "p30", "p40", "p50", "p60", "p70", "p80", "p90"]
            for i, label in enumerate(labels):
                qi = i + 1  # index 0 is mean/base, indices 1-9 are quantiles
                if qi < num_quantiles:
                    quantiles[label] = q_arr[:, qi].tolist()
            if num_quantiles == 10:
                quantiles["mean"] = q_arr[:, 0].tolist()
        else:
            quantiles["raw"] = q_arr.tolist()

    elapsed = (time.time() - t0) * 1000
    logger.info(f"Forecast: horizon={req.horizon}, input_len={len(arr)}, elapsed={elapsed:.0f}ms")

    return ForecastResponse(
        point=point,
        quantiles=quantiles,
        horizon=req.horizon,
        model_version="timesfm-2.5-200m",
    )


@app.post("/forecast/batch", response_model=BatchForecastResponse)
async def forecast_batch(req: BatchForecastRequest):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model not yet loaded")

    t0 = time.time()
    inputs = [np.array(s, dtype=np.float32) for s in req.series_list]

    point_forecast, quantile_forecast = model.forecast(
        horizon=req.horizon,
        inputs=inputs,
    )

    forecasts: List[ForecastResponse] = []
    for i in range(len(inputs)):
        point = point_forecast[i].tolist()
        quantiles = {}
        if quantile_forecast is not None and quantile_forecast.ndim == 3:
            q_arr = quantile_forecast[i]  # shape: (horizon, 10)
            num_quantiles = q_arr.shape[1]
            if num_quantiles >= 9:
                labels = ["p10", "p20", "p30", "p40", "p50", "p60", "p70", "p80", "p90"]
                for j, label in enumerate(labels):
                    qi = j + 1  # index 0 is mean/base, indices 1-9 are quantiles
                    if qi < num_quantiles:
                        quantiles[label] = q_arr[:, qi].tolist()
                if num_quantiles == 10:
                    quantiles["mean"] = q_arr[:, 0].tolist()
            else:
                quantiles["raw"] = q_arr.tolist()

        forecasts.append(
            ForecastResponse(
                point=point,
                quantiles=quantiles,
                horizon=req.horizon,
                model_version="timesfm-2.5-200m",
            )
        )

    elapsed = (time.time() - t0) * 1000
    logger.info(f"Batch forecast: n={len(inputs)}, elapsed={elapsed:.0f}ms")

    return BatchForecastResponse(forecasts=forecasts, elapsed_ms=elapsed)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("FORECAST_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
