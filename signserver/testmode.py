# init a inferencer
#         # call the predict
#         return input_data
from inference import Inferencer
import pandas as pd
inferencer = Inferencer(model_path="model.tflite")

# call the predict

sample_path= '../signModel/data/2044/635217.parquet'
def converdata(path):
    data_columns = ['x', 'y', 'z']
    # ready to change the path to the pd 
    data = pd.read_parquet(path, columns=data_columns) # change the code 
    
    # convert the data to json
    return data.to_json(orient='records')
print(converdata(sample_path))
result= inferencer.predict(converdata(sample_path))
print(result)