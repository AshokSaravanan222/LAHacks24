import numpy as np
import tensorflow as tf
import pandas as pd

# Load TFLite model and allocate tensors.
interpreter = tf.lite.Interpreter(model_path="signModel/model.tflite")
interpreter.allocate_tensors()

# Get input and output tensors.
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print(input_details)
print(output_details)



ROWS_PER_FRAME = 543  # number of landmarks per frame
def load_relevant_data_subset(pq_path):
    data_columns = ['x', 'y', 'z']
    data = pd.read_parquet(pq_path, columns=data_columns) # change the code 
    n_frames = int(len(data) / ROWS_PER_FRAME)
    data = data.values.reshape(n_frames, ROWS_PER_FRAME, len(data_columns))
    return data.astype(np.float32)

# load a subset of the data
data = load_relevant_data_subset('signModel/data/2044/635217.parquet')
print(data.shape)

# data is the test data , and shape is (7, 543, 3)

# Set input tensor.
interpreter.set_tensor(input_details[0]['index'], data)

# Run inference.
interpreter.invoke()

# Get output tensor.
output_data = interpreter.get_tensor(output_details[0]['index'])

# Process output (example: print the output).
print(output_data)





# # Set input tensor.
# interpreter.set_tensor(input_details[0]['index'], data)

# # Run inference.
# interpreter.invoke()

# # Get output tensor.
# output_data = interpreter.get_tensor(output_details[0]['index'])

# # Process output (example: print the output).
# print(output_data)
