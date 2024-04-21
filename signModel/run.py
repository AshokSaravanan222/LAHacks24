#check inference time
#code from @hengck23
mode = 's' #'d'ebug #'s'ubmit

import pandas as pd
import numpy as np
import os
import shutil
from datetime import datetime
from timeit import default_timer as timer
import tensorflow as tf
import json

def read_json_file(file_path):
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

train_df = pd.read_csv('signModel/train.csv')
print("\n\n... LOAD SIGN TO PREDICTION INDEX MAP FROM JSON FILE ...\n")
s2p_map = {k.lower():v for k,v in read_json_file(os.path.join("signModel/sign_to_prediction_index_map.json")).items()}
p2s_map = {v:k for k,v in read_json_file(os.path.join("signModel/sign_to_prediction_index_map.json")).items()}
encoder = lambda x: s2p_map.get(x.lower())
decoder = lambda x: p2s_map.get(x)
# print(s2p_map)
train_df['label'] = train_df.sign.map(encoder)


print('import ok')
'''
Your model must also require less than 40 MB in memory and 
perform inference with less than 100 milliseconds of latency per video. 
Expect to see approximately 40,000 videos in the test set. 
We allow an additional 10 minute buffer for loading the data and miscellaneous overhead.

'''
def time_to_str(t, mode='min'):
    if mode=='min':
        t  = int(t)/60
        hr = t//60
        min = t%60
        return '%2d hr %02d min'%(hr,min)

    elif mode=='sec':
        t   = int(t)
        min = t//60
        sec = t%60
        return '%2d min %02d sec'%(min,sec)

    else:
        raise NotImplementedError

        
ROWS_PER_FRAME = 543
def load_relevant_data_subset(pq_path):
    data_columns = ['x', 'y', 'z']
    data = pd.read_parquet(pq_path, columns=data_columns)
    n_frames = int(len(data) / ROWS_PER_FRAME)
    data = data.values.reshape(n_frames, ROWS_PER_FRAME, len(data_columns))
    return data.astype(np.float32)


# Load TFLite model and allocate tensors.
interpreter = tf.lite.Interpreter(model_path="signModel/model.tflite")
prediction_fn = interpreter.get_signature_runner('serving_default')
#     valid_df = pd.read_csv('/kaggle/input/asl-demo/train_prepared.csv') 
#     valid_df = train_df[train_df.fold==0].reset_index(drop=True)
#     valid_df = valid_df[:1000]
valid_df = train_df[:1000]
valid_num = len(valid_df)
valid = {
    'sign':[],
}

start_timer = timer()
for t, d in valid_df.iterrows():
    pq_file = f'signModel/{d.path}'
    #print(pq_file)
    try:
        xyz = load_relevant_data_subset(pq_file)
    except:
        print(f'error in {pq_file}')
        continue

    output = prediction_fn(inputs=xyz)
    p = output['outputs'].reshape(-1)

    valid['sign'].append(p)

    #---
    if t%100==0:
        time_taken = timer() - start_timer
        print('\r %8d / %d  %s'%(t,valid_num,time_to_str(time_taken,'sec')),end='',flush=True)

print('\n')


truth = valid_df.label.values
sign  = np.stack(valid['sign'])
predict = np.argsort(-sign, -1)
correct = predict==truth.reshape(valid_num,1)
topk = correct.cumsum(-1).mean(0)[:5]


print(f'time_taken = {time_to_str(time_taken,"sec")}')
print(f'time_taken for LB = {time_taken*1000/valid_num:05f} msec\n')
for i in range(5):
    print(f'topk[{i}] = {topk[i]}')  
print('----- end -----\n')