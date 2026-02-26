import numpy as np
import librosa
from PIL import Image

def extract_features(audio_chunk, sr=16000):
    """Simulates the C++ esp-dsp library for feature extraction."""
    # 1. Calculate 20 MFCCs
    mfcc = librosa.feature.mfcc(y=audio_chunk, sr=sr, n_mfcc=20, hop_length=512)
    
    # 2. Resize to 96x96 and Normalize
    img = Image.fromarray(mfcc.T)
    img = img.resize((96, 96), Image.BILINEAR)
    img_np = np.array(img)
    img_np = (img_np - np.mean(img_np)) / (np.std(img_np) + 1e-7)
    
    # 3. Format as 96x96x3 Tensor for MobileNetV2
    ch3 = np.stack([img_np]*3, axis=-1)
    input_tensor = np.expand_dims(ch3, axis=0).astype(np.float32)
    
    return input_tensor