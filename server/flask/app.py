from flask import Flask, request, jsonify
import tensorflow as tf

app = Flask(__name__)

# Load the model
model = tf.keras.models.load_model('path_to_your_model')

@app.route('/detect', methods=['POST'])
def detect():
    # Assuming JSON input which contains the features in a structure expected by the model
    data = request.get_json(force=True)
    # Convert input data to DataFrame or the appropriate format for your model
    df = pd.DataFrame(data)
    # Make prediction
    predictions = model.predict(df)
    # Convert predictions to a suitable format to return as JSON
    return jsonify(predictions.tolist())

if __name__ == "__main__":
    app.run()
