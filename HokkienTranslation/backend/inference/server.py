# server.py
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  # silence TF logs (not used, but prevents noise)

import io
import time
import traceback
from typing import Dict
import subprocess, tempfile
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import torch
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from transformers import WhisperProcessor, WhisperForConditionalGeneration

# -------------------------------
# Model load (once, at startup)
# -------------------------------
MODEL_ID = "MiraW/whisper-small-hokkien"  # Tailo romanization
processor = WhisperProcessor.from_pretrained(MODEL_ID)
model = WhisperForConditionalGeneration.from_pretrained(MODEL_ID)
model.eval()

# Normalize generation config (critical: "mandarin" must be lowercase)
gc = model.generation_config
gc.language = "mandarin"  # NOT "zh" or capitalized
gc.task = "transcribe"
gc.forced_decoder_ids = processor.get_decoder_prompt_ids(
    language="mandarin",
    task="transcribe",
)
model.generation_config = gc

# Optional: use GPU if available
USE_CUDA = torch.cuda.is_available()
if USE_CUDA:
    model.to("cuda")

# -------------------------------
# FastAPI app
# -------------------------------
app = FastAPI(title="Hokkien ASR (Tailo)")

# CORS (relax for dev; restrict in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Utils
# -------------------------------
def load_audio_to_16k_mono(file_bytes: bytes) -> np.ndarray:
    """
    Try to read with soundfile; if it fails (e.g., .m4a), use ffmpeg to decode
    to 16 kHz mono WAV, then load.
    """
    # First attempt: libsndfile (fast path for WAV/FLAC/etc.)
    try:
        data, sr = sf.read(io.BytesIO(file_bytes), dtype="float32", always_2d=False)
        if data.ndim == 2:
            data = data.mean(axis=1)
        if sr != 16000:
            data = resample_poly(data, 16000, sr).astype("float32")
        return data
    except Exception:
        # Fallback: use ffmpeg to decode arbitrary formats (M4A/AAC, MP3, etc.)
        with tempfile.NamedTemporaryFile(suffix=".bin") as inp, \
             tempfile.NamedTemporaryFile(suffix=".wav") as out:
            inp.write(file_bytes); inp.flush()
            cmd = [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-i", inp.name,
                "-ac", "1", "-ar", "16000",
                "-acodec", "pcm_s16le",
                out.name,
            ]
            subprocess.run(cmd, check=True)
            # Now read the produced WAV with soundfile
            data, sr = sf.read(out.name, dtype="float32", always_2d=False)
            if data.ndim == 2:
                data = data.mean(axis=1)
            # sr is guaranteed 16000 due to ffmpeg args
            return data.astype("float32")

# -------------------------------
# Routes
# -------------------------------
@app.get("/health")
def health() -> Dict:
    return {"ok": True, "model": MODEL_ID, "cuda": USE_CUDA}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)) -> Dict:
    """
    Multipart upload: field name 'file'.
    Returns: { text, elapsed_sec, model_id }
    """
    try:
        raw = await file.read()
        audio = load_audio_to_16k_mono(raw)

        t0 = time.time()
        inputs = processor(audio, sampling_rate=16000, return_tensors="pt")
        if USE_CUDA:
            inputs = {k: v.to("cuda") for k, v in inputs.items()}

        with torch.no_grad():
            pred_ids = model.generate(inputs["input_features"], max_new_tokens=225)

        text = processor.batch_decode(pred_ids, skip_special_tokens=True)[0]
        elapsed = round(time.time() - t0, 3)

        return {"text": text, "elapsed_sec": elapsed, "model_id": MODEL_ID}

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "type": e.__class__.__name__},
        )