from flask import Flask
from flask_socketio import SocketIO
from inference import Inferencer
import json
import google.generativeai as genai
from dotenv import load_dotenv
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

socketio = SocketIO(app, cors_allowed_origins="*")

interpreter =  Inferencer(model_path="signserver/model.tflite")

ten_word_array = []

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


# Hopefully this is called when the list = 10 to generate a sentence

def generate_response(word_set):
    input_prompt = (f'I am a new ASL learner and I have created an '
                    f'application where it translates ASL and prints out words. '
                    f'These words are later stored in to a set to avoid duplicates. '
                    f'The set currently contains: {", ".join(word_set)}. '
                    f'Generate a sentence based off of this set.')
    response = model.generate_content([input_prompt])
    # print(response)
    generated_sentence = response._result.candidates[0].content.parts[0].text
    print(generated_sentence)
    return generated_sentence



@socketio.on('message') # test 
def handle_message(data):
    # print function can not work at handle_message
    print("Reciing message")
    print('received message: ', json.dumps(data))
    socketio.emit('output', interpreter.predict(data))

@socketio.on('landmark') # from end 
def handle_landmarks(data):
   # print('received landmarks: ', json.dumps(data))
   prediction = interpreter.predict(data)
   handle_prediction(prediction)
   socketio.emit('output', prediction) #
    

# if someone connect to the server, it will print the message
@socketio.on('connect')
def test_connect():
    print("Connected")

# if someone disconnect to the server, it will print the message
@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')


@app.route('/message')
def message():
    print('Hello World!')
    return 'Hello World!'


def handle_prediction(prediction):
    ten_word_array.append(prediction)
    if len(ten_word_array) == 10:
        response = generate_response(ten_word_array)
        ten_word_array.clear()
        socketio.emit('sentence', response)

if __name__ == '__main__':
    socketio.run(app,host='0.0.0.0',port=8080)


