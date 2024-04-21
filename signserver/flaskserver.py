from flask import Flask, render_template
from flask_socketio import SocketIO
from inference import Inferencer
import json
from server.run import generate_response

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

interpreter =  Inferencer(model_path="signserver/model.tflite")


@socketio.on('message') # test 
def handle_message(data):
    # print function can not work at handle_message
    print("Reciing message")
    print('received message: ', json.dumps(data))
    socketio.emit('output', interpreter.predict(data))

@socketio.on('landmark') # from end 
def handle_landmarks(data):
   # print('received landmarks: ', json.dumps(data))
    socketio.emit('output', interpreter.predict(data)) #
    

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

# Hopefully this is called when the list = 10 to generate a sentence
@socketio.on('generated_sentence') 
def generated_response(data):
    ten_word_array = []
    while len(ten_word_array) < 10:
        prediction = interpreter.predict(data)
        ten_word_array.append(prediction)
        if len(ten_word_array) == 10:
            response = generate_response(ten_word_array)
            ten_word_array.clear()
            socketio.emit('response', response)


if __name__ == '__main__':
    socketio.run(app,host='0.0.0.0',port=8080)



