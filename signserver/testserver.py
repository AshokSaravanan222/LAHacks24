# write a test function to send the sample data to the socketio server

import socketio
import pandas as pd

# Create a SocketIO client instance
sio = socketio.Client()

# Define a function to handle the 'connect' event
@sio.event
def connect():
    print('Connected to server')

# Define a function to handle the 'disconnect' event
@sio.event
def disconnect():
    print('Disconnected from server')

sample_path= '../signModel/data/2044/635217.parquet'
def converdata(path):
    data_columns = ['x', 'y', 'z']
    # ready to change the path to the pd 
    data = pd.read_parquet(path, columns=data_columns) # change the code 
    # convert the data to json
    return data.to_json(orient='records')

# receive the message from the server
@sio.on('output')
def on_message(data):
    print('Received message from server:', data)
    
if __name__ == '__main__':
    # Connect to the server
    sio.connect('http://localhost:8080')

    #Send a message to the server
    message = converdata(sample_path)
    # too large the message .

    print("sending :","json test file")
    sio.emit('message', message)
    print('Sent message to server')

sio.wait()

    # Disconnect from the server
   # sio.disconnect()

