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
# wifi = pd.read_csv('./dataset/wifi.csv')
embedded_sensor_1 = pd.read_csv('./dataset/embedded_sensor_1.csv')
# embedded_sensor_2 = pd.read_csv('./dataset/embedded_sensor_2.csv')
print("Done")

print("concat individual dataframes into merged_df ...")
# merged_df = pd.concat([
#     app_usage, battery, bluetooth, call_log, data_traffic,
#     device_event, fitness, external_sensor, installed_app, key_log,
#     location, media, message, notification, physical_activity,
#     physical_activity_transition, survey, wifi], ignore_index=True)
# merged_df = pd.concat([embedded_sensor_1, embedded_sensor_2], ignore_index=True)
merged_df = embedded_sensor_1
print("Done")

print("extract emails from merged_df ...")
#Extract Email
for i in np.arange(0, len(merged_df), 1):
    merged_df.at[i, 'subject_email']=eval(merged_df['subject'][i])['email']
print("Done")

print("extract timestamps from merged_df ...")
#Extract Minute
merged_df['minute']=pd.to_datetime(merged_df['timestamp'], unit='ms').dt.strftime('%y-%m-%d %H:%M')
print("Done")

print("count the values for each minute, subject_email and datum Type ...")
#Count values
minute_cnt = merged_df.groupby(['minute', 'subject_email', 'datumType']).count()[['value']].reset_index()
# print(minute_cnt)
print("Done")

print("count the values for each hour, subject_email and datum Type ...")
minute_cnt['hour']=pd.to_datetime(minute_cnt['minute']).dt.strftime('%y-%m-%d %H')
hour_cnt = minute_cnt.groupby(['hour', 'subject_email', 'datumType']).count()[['value']].reset_index()
# print(hour_cnt)
print("Done")

print("count the values for each date, subject_email and datum Type ...")
minute_cnt['date']=pd.to_datetime(minute_cnt['minute']).dt.strftime('%y-%m-%d')
date_cnt = minute_cnt.groupby(['date', 'subject_email', 'datumType']).count()[['value']].reset_index()
# print(date_cnt)
print("Done")

print("save the result as [date/hour/minute]_cnt.csv files each ...")
date_cnt.to_csv("date_cnt.csv", mode='a', header=False)
hour_cnt.to_csv("hour_cnt.csv", mode='a', header=False)
minute_cnt.to_csv("minute_cnt.csv", mode='a', header=False)
print("Done")