from flask import Flask, render_template
from flask_socketio import SocketIO
from inference import Inferencer
import json

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


data_set=[]
@socketio.on('landmark') # from end 
def handle_landmarks(data):
   # print('received landmarks: ', json.dumps(data))
    # collect 10 data and combine them to do next step
    if len(data_set) < 10:
        data_set.append(data)
    else:
        # combint all the data in data_set to one data

        # connect each of the data_set to one string and send to the model
        result = [] 
        for i in data_set:
            # i is str and turn it as a list 
            result.extend(json.loads(i))
        
        # make result as str 
        data = json.dumps(result)

        socketio.emit('output', interpreter.predict(data)) #
        data_set.clear()
    

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


if __name__ == '__main__':
    socketio.run(app,host='0.0.0.0',port=8080)



