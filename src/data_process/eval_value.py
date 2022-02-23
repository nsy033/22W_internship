from email.header import Header
from queue import Empty
import pandas as pd
import numpy as np

print("read csv files ...")
# app_usage = pd.read_csv('./dataset/app_usage_event.csv')
# battery = pd.read_csv('./dataset/battery.csv')
# bluetooth = pd.read_csv('./dataset/bluetooth.csv')
# call_log = pd.read_csv('./dataset/call_log.csv')
# data_traffic = pd.read_csv('./dataset/data_traffic.csv')
# device_event = pd.read_csv('./dataset/device_event.csv')
# fitness = pd.read_csv('./dataset/fitness.csv')
# embedded_sensor = pd.read_csv('./dataset/embedded_sensor.csv')
# external_sensor = pd.read_csv('./dataset/external_sensor.csv')
# installed_app = pd.read_csv('./dataset/installed_app.csv')
# key_log = pd.read_csv('./dataset/key_log.csv')
# location = pd.read_csv('./dataset/location.csv')
# media = pd.read_csv('./dataset/media.csv')
# message = pd.read_csv('./dataset/message.csv')
# notification = pd.read_csv('./dataset/notification.csv')
# physical_activity = pd.read_csv('./dataset/physical_activity.csv')
# physical_activity_transition = pd.read_csv('./dataset/physical_activity_transition.csv')
# survey = pd.read_csv('./dataset/survey.csv')
wifi = pd.read_csv('./dataset/wifi.csv')
print("Done")

cur_scv = wifi

print("extract needed values from csv ...")
# cur_scv['prev_timestamp'] = cur_scv.timestamp.shift()
# cur_scv['eval_duration']=cur_scv.timestamp - cur_scv.timestamp.shift()
# idx_nm = []
for i in np.arange(0, len(cur_scv), 1):
    cur_scv.at[i, 'subject_email']=eval(cur_scv['subject'][i])['email']
    evaluated = eval(cur_scv['value'][i])['accessPoint']
    cur_scv.at[i, 'eval_numOfAP']=len(evaluated)
    listOfAP=[]
    for j in range(0, len(evaluated)):
        name = evaluated[j]['ssid'].encode('ascii', 'ignore')
        if len(name) > 1 and len(name) < 20 and '  ' not in name and name not in listOfAP:
            listOfAP.append(name)
        if len(listOfAP) >= 6:
            listOfAP.append('...')
            break
    cur_scv.loc[i, 'eval_listOfAP']=''
    cur_scv.at[i, 'eval_listOfAP']=listOfAP
    if i % 100 == 1:
        print(i, listOfAP)
#     evaluated = eval(cur_scv['value'][i])['activity'][0]['type']
#     print(i, evaluated)
#     if evaluated != 'UNDEFINED':
#         cur_scv.loc[i, 'eval_type']=''
#         cur_scv.at[i, 'eval_type']= evaluated
#     else:
#         idx_nm.append(i)
# cur_scv = cur_scv.drop(idx_nm)
print("Done")

cur_scv.drop("uploadTime", axis=1, inplace=True)
cur_scv.drop("utcOffsetSec", axis=1, inplace=True)
cur_scv.drop("offsetTimestamp", axis=1, inplace=True)
cur_scv.drop("offsetUploadTime", axis=1, inplace=True)
cur_scv.drop("_id", axis=1, inplace=True)
cur_scv.drop("value", axis=1, inplace=True)
cur_scv.drop("subject", axis=1, inplace=True)

print("save the result file ...")
cur_scv.to_csv("eval.csv", mode='w')

print("Done")
