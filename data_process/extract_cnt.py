import pandas as pd
import numpy as np

print("read csv files ...")
app_usage = pd.read_csv('./dataset/app_usage_event.csv')
battery = pd.read_csv('./dataset/battery.csv')
bluetooth = pd.read_csv('./dataset/bluetooth.csv')
call_log = pd.read_csv('./dataset/call_log.csv')
data_traffic = pd.read_csv('./dataset/data_traffic.csv')
device_event = pd.read_csv('./dataset/device_event.csv')
fitness = pd.read_csv('./dataset/fitness.csv')
external_sensor = pd.read_csv('./dataset/external_sensor.csv')
installed_app = pd.read_csv('./dataset/installed_app.csv')
key_log = pd.read_csv('./dataset/key_log.csv')
location = pd.read_csv('./dataset/location.csv')
media = pd.read_csv('./dataset/media.csv')
message = pd.read_csv('./dataset/message.csv')
notification = pd.read_csv('./dataset/notification.csv')
physical_activity = pd.read_csv('./dataset/physical_activity.csv')
physical_activity_transition = pd.read_csv('./dataset/physical_activity_transition.csv')
survey = pd.read_csv('./dataset/survey.csv')
wifi = pd.read_csv('./dataset/wifi.csv')
print("Done")

print("concat individual dataframes into merged_df ...")
merged_df = pd.concat([
    app_usage, battery, bluetooth, call_log, data_traffic,
    device_event, fitness, external_sensor, installed_app, key_log,
    location, media, message, notification, physical_activity,
    physical_activity_transition, survey, wifi], ignore_index=True)
print("Done")

print("extract emails from merged_df ...")
#Extract Email
for i in np.arange(0, len(merged_df), 1):
    merged_df.at[i, 'subject_email']=eval(merged_df['subject'][i])['email']
print("Done")

print("extract dates and hours from merged_df ...")
#Extract Date
merged_df['date']=pd.to_datetime(merged_df['timestamp'], unit='ms').dt.date
merged_df['hour']=pd.to_datetime(merged_df['timestamp'], unit='ms').dt.hour
print("Done")

print("count the values for each date/hour, subject_email and datum Type ...")
#Count values
date_cnt = merged_df.groupby(['date', 'subject_email', 'datumType']).count()[['value']].reset_index()
hour_cnt = merged_df.groupby(['date', 'hour', 'subject_email', 'datumType']).count()[['value']].reset_index()
print("Done")

print("save the result as merged_df.csv file ...")
date_cnt.to_csv("date_cnt.csv", mode='w')
hour_cnt.to_csv("hour_cnt.csv", mode='w')
print("Done")