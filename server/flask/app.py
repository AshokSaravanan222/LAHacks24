from flask import Flask
app = Flask(__name__)

@app.route('/', me)
def hello_world():
    # take in the frames
    # run the model
    # return the result
    return 'Hello, World!'


if __name__ == "__main__":
	app.run()