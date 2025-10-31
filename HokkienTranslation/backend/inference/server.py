from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import io, time
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration

# --- Model: load once at process start (MUCH faster) ---
MODEL_ID = "MiraW/whisper-small-hokkien"  # Tailo romanization
processor = WhisperProcessor.from_pretrained(MODEL_ID)
model = WhisperForConditionalGeneration.from_pretrained(MODEL_ID)
model.eval()
if torch.cuda.is_available():
    model.to("cuda")

app = FastAPI()
# Allow your app origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

def load_audio_to_16k_mono(file_bytes: bytes) -> np.ndarray:
    """Read audio from bytes; convert to float32, mono, 16 kHz."""
    data, sr = sf.read(io.BytesIO(file_bytes), dtype="float32", always_2d=False)
    if data.ndim == 2:  # stereo -> mono
        data = data.mean(axis=1)
    if sr != 16000:
        data = resample_poly(data, 16000, sr).astype("float32")
    return data

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)) -> Dict:
    raw = await file.read()
    audio = load_audio_to_16k_mono(raw)

    # Force Min Nan + transcribe (not translate)
    model.config.forced_decoder_ids = processor.get_decoder_prompt_ids(
        language="zh", task="transcribe"
    )

    started = time.time()
    inputs = processor(audio, sampling_rate=16000, return_tensors="pt")
    if torch.cuda.is_available():
        inputs = {k: v.to("cuda") for k, v in inputs.items()}

    with torch.no_grad():
        pred_ids = model.generate(inputs["input_features"], max_new_tokens=225)

    text = processor.batch_decode(pred_ids, skip_special_tokens=True)[0]
    elapsed = time.time() - started
    return {"model_id": MODEL_ID, "text": text, "elapsed_sec": round(elapsed, 3)}
