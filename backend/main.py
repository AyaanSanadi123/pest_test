import numpy as np
import librosa
import requests
import time
from datetime import datetime

# Import your custom modules
from dsp_engine import extract_features
from inference_engine import EdgeBrain

# --- 1. CONFIGURATION ---
TFLITE_MODEL = "pest_model_float32.tflite" 
TEST_AUDIO_FILE = "../test.wav"
NEXTJS_API_URL = "http://localhost:3000/api/alerts"
DEVICE_ID = "ESP32_SILO_01"

BUFFER_SEC = 1.5
SR = 16000
BUFFER_SAMPLES = int(BUFFER_SEC * SR)
CLASSES = ["Background", "Mealworm_L", "Weevil_L", "Flour_Beetle", "Weevil_A"]

DEBUG_RMS = True
SILENCE_THRESHOLD = 0.005 # Change this if your debug RMS numbers are higher/lower

# --- 2. TELEMETRY TRANSMITTER ---
def transmit_alert(insect, confidence, rms_val, infer_time):
    # This payload exactly matches the 6 parameters our Next.js CSV logger expects
    payload = {
        "device_id": DEVICE_ID,
        "predicted_class": insect,
        "confidence": float(round(confidence, 1)),
        "rms_energy": float(round(rms_val, 5)),
        "inference_time_ms": float(round(infer_time, 1)),
        "timestamp": datetime.now().isoformat()
    }
    try:
        res = requests.post(NEXTJS_API_URL, json=payload, timeout=2)
        if res.status_code == 200:
            print("   🌐 [Wi-Fi] Telemetry logged to Next.js CSV!")
    except Exception:
        print("   ❌ [Wi-Fi Error] Could not reach Next.js Server. Is it running?")

# --- 3. MAIN LOOP ---
def main():
    brain = EdgeBrain(TFLITE_MODEL)
    
    print(f"\n🎙️ Booting Microphone Simulator on: {TEST_AUDIO_FILE}")
    try:
        y, _ = librosa.load(TEST_AUDIO_FILE, sr=SR)
    except Exception as e:
        print(f"❌ Error loading audio file: {e}")
        return

    # Slide across the audio file simulating real-time buffering
    for start_idx in range(0, len(y) - BUFFER_SAMPLES, int(SR * 0.5)):
        end_idx = start_idx + BUFFER_SAMPLES
        audio_chunk = y[start_idx:end_idx]
        current_time_sec = start_idx / SR
        
        # --- ENERGY GATE ---
        rms = np.mean(librosa.feature.rms(y=audio_chunk))
        if DEBUG_RMS:
            print(f"[{current_time_sec:05.1f}s] RMS Energy: {rms:.5f}")
        
        if rms < SILENCE_THRESHOLD:
            continue
            
        # --- DSP & INFERENCE ---
        input_tensor = extract_features(audio_chunk, SR)
        probs, infer_time = brain.predict(input_tensor)
        
        best_idx = np.argmax(probs)
        confidence = probs[best_idx] * 100
        detected_class = CLASSES[best_idx]
        
        # --- TRIGGER ---
        if best_idx != 0 and confidence > 85.0:
            print(f"\n🚨 [TRIGGER @ {current_time_sec:05.1f}s] {detected_class} ({confidence:.1f}%) | RMS: {rms:.4f}")
            transmit_alert(detected_class, confidence, rms, infer_time)
            time.sleep(1) # Cooldown

if __name__ == "__main__":
    main()