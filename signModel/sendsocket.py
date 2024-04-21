import socketio

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

if __name__ == '__main__':
    # Connect to the server
    sio.connect('http://localhost:5000')

    # Send a message to the server
    message = 'Hello, server!'
    sio.emit('message', message)
    print('Sent message:', message )

    # Disconnect from the server
    sio.disconnect()
