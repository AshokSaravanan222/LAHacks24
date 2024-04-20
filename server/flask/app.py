from flask import Flask
app = Flask(__name__)

@app.route('/detect', methods=['POST'])
def detect():
    print("Called on server")
    return "Called on server"

if __name__ == "__main__":
    app.run(debug=True)
