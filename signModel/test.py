import tensorflow as tf
import pandas as pd
import numpy as np

interpreter = tf.lite.Interpreter(model_path="signModel/model.tflite")
prediction_fn = interpreter.get_signature_runner('serving_default')

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print(input_details)
print(output_details)

pq_path = "signModel/data/2044/635217.parquet"
ROWS_PER_FRAME = 543

data_columns = ['x', 'y', 'z']
data = pd.read_parquet(pq_path, columns=data_columns) # change the code 
n_frames = int(len(data) / ROWS_PER_FRAME)
data = data.values.reshape(n_frames, ROWS_PER_FRAME, len(data_columns))
xyz = data.astype(np.float32)

output = prediction_fn(inputs=xyz)
p = output['outputs'].reshape(-1)
print(p)