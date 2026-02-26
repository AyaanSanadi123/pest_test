import tensorflow as tf
import time

class EdgeBrain:
    def __init__(self, model_path):
        print(f"Loading Edge Brain from {model_path}...")
        self.interpreter = tf.lite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

    def predict(self, input_tensor):
        """Pushes the tensor through the frozen TFLite graph."""
        start_infer = time.time()
        
        self.interpreter.set_tensor(self.input_details[0]['index'], input_tensor)
        self.interpreter.invoke()
        probs = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        
        infer_time = (time.time() - start_infer) * 1000 # convert to milliseconds
        return probs, infer_time