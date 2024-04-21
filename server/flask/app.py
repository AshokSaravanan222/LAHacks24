from flask import Flask
from flask_socketio import SocketIO
import json
import pandas as pd
import tensorflow as tf
import json
from io import StringIO
import numpy as np
import google.generativeai as genai
import os

def read_json_file(file_path):
    """Read a JSON file and parse it into a Python object.

    Args:
        file_path (str): The path to the JSON file to read.

    Returns:
        dict: A dictionary object representing the JSON data.
    
    Raises:
        FileNotFoundError: If the specified file path does not exist.
        ValueError: If the specified file path does not contain valid JSON data.
    """
    try:
        # Open the file and load the JSON data into a Python object
        with open(file_path, 'r') as file:
            json_data = json.load(file)
        return json_data
    except FileNotFoundError:
        # Raise an error if the file path does not exist
        raise FileNotFoundError(f"File not found: {file_path}")
    except ValueError:
        # Raise an error if the file does not contain valid JSON data
        raise ValueError(f"Invalid JSON data in file: {file_path}")


app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

socketio = SocketIO(app, cors_allowed_origins="*")

interpreter = tf.lite.Interpreter("signserver/model.tflite")

train_df = pd.read_csv('signserver/train.csv')

# decorder 
s2p_map = {k.lower():v for k,v in read_json_file("signserver/sign_to_prediction_index_map.json").items()}
p2s_map = {v:k for k,v in read_json_file("signserver/sign_to_prediction_index_map.json").items()}
encoder = lambda x: s2p_map.get(x.lower())
decoder = lambda x: p2s_map.get(x)
train_df['label'] = train_df.sign.map(encoder)

GEMINI_KEY = "AIzaSyBqF1tP8UWr9govt44Vu-frpALNVR38tgA"
genai.configure(api_key=GEMINI_KEY)

generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 0,
  "max_output_tokens": 8192,
}

safety_settings = [
  {
    "category": "HARM_CATEGORY_HARASSMENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_HATE_SPEECH",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
]

model = genai.GenerativeModel(model_name="gemini-1.5-pro-latest",
                              generation_config=generation_config,
                              safety_settings=safety_settings)

@socketio.on('landmark') 
def handle_landmarks(data):
    ROWS_PER_FRAME = 543
    data_columns = ['x', 'y', 'z']
    data = pd.read_json(StringIO(data))
    n_frames = int(len(data) / ROWS_PER_FRAME)

    # Reshape and prepare data
    data = data.values.reshape(n_frames, ROWS_PER_FRAME, len(data_columns))
    xyz = data.astype(np.float32)

    # Allocate tensors inside the function to ensure all operations are scoped
    interpreter.allocate_tensors()

    # Get the signature runner inside the function scope to use it immediately
    predict_fn = interpreter.get_signature_runner('serving_default')

    # Execute the prediction function and handle the output directly
    output = predict_fn(inputs=xyz)
    prediction_indices = output['outputs'].reshape(-1)
    max_index = prediction_indices.argmax()
    top_5_indices = prediction_indices.argsort()[-5:][::-1]

    # Decode the prediction to human-readable form
    result = decoder(max_index)
    top_5_results = [decoder(index) for index in top_5_indices]

    # Output results and clear references
    print(result)
    print(top_5_results)
    print("test")
    socketio.emit('output', str(result))

    # Make sure to delete references if there's no further use
    del data, xyz, output, predict_fn
    

@socketio.on('gemini_request')
def handle_gemini(data):
    input_prompt = json.loads(data)["prompt"]
    response = model.generate_content([input_prompt])
    generated_sentence = response._result.candidates[0].content.parts[0].text
    print(generated_sentence)
    socketio.emit('gemini_response', generated_sentence)

# if someone connect to the server, it will print the message
@socketio.on('connect')
def test_connect():
    print("Connected")

# if someone disconnect to the server, it will print the message
@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')
    


if __name__ == '__main__':
    socketio.run(app,host='0.0.0.0',port=8080, debug=True)


