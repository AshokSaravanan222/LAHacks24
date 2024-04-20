from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)


#10.10.1.224

@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)
    # if data is buffer , how to collect it and send it to the model, give me the code example 


if __name__ == '__main__':
    socketio.run(app)


