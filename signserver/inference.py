import tensorflow as tf
import pandas as pd
import numpy as np
from multiprocessing import cpu_count
import json
import os

class Inferencer:
    def __init__(self, model_path):
        """
        Initialize the TensorFlow model.

        Args:
        - model_path: Path to the saved TensorFlow model.
        """
        self.interpreter = tf.lite.Interpreter(model_path)


    def read_json_file(self,file_path):
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





    def predict(self, input_data):
        """
        Perform prediction using the loaded model.

        Args:
        - input_data: Input data for prediction.

        Returns:
        - prediction: Predicted output.
        """
        # Perform any preprocessing if required
        # For example, if input_data is an image, you might need to resize and normalize it
        
        # Perform prediction

        # input_data only be the parquet 
        # call after the init
        
        prediction_fn = self.interpreter.get_signature_runner('serving_default')
        ROWS_PER_FRAME = 543

        # input_data shoulb be the x,y,z 

        # change the input_data to the format that the model expects
        data_columns = ['x', 'y', 'z']
        # ready to change the path to the pd 
    
        data = pd.read_json(input_data) # change the code 
        print(data)
        print(data.shape)
        print(type(data))
        print(type(input_data)) 
       # print(input_data) # str

        n_frames = int(len(data) / ROWS_PER_FRAME)
        
        data = data.values.reshape(n_frames, ROWS_PER_FRAME, len(data_columns))
        #ValueError: cannot reshape array of size 1659 into shape (1,543,3)

        xyz = data.astype(np.float32)
        train_df = pd.read_csv('signserver/train.csv')

        # decorder 
        print("\n\n... LOAD SIGN TO PREDICTION INDEX MAP FROM JSON FILE ...\n")
        s2p_map = {k.lower():v for k,v in self.read_json_file("signserver/sign_to_prediction_index_map.json").items()}
        p2s_map = {v:k for k,v in self.read_json_file("signserver/sign_to_prediction_index_map.json").items()}
        encoder = lambda x: s2p_map.get(x.lower())
        decoder = lambda x: p2s_map.get(x)
        train_df['label'] = train_df.sign.map(encoder)

        output = prediction_fn(inputs=xyz)
        p = output['outputs'].reshape(-1)
        
        result=decoder(p.argmax())
        print(result)
        
        return result
    



