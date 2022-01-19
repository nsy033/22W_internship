import pandas as pd
import numpy as np
import csv

print("read csv files ...")
# app_usage = pd.read_csv('./dataset/app_usage_event.csv')
# battery = pd.read_csv('./dataset/battery.csv')
# bluetooth = pd.read_csv('./dataset/bluetooth.csv')
# call_log = pd.read_csv('./dataset/call_log.csv')
# data_traffic = pd.read_csv('./dataset/data_traffic.csv')
# device_event = pd.read_csv('./dataset/device_event.csv')
# fitness = pd.read_csv('./dataset/fitness.csv')
embedded_sensor = pd.read_csv('./dataset/embedded_sensor.csv')
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
print("Done")

print("concat individual dataframes into merged_df ...")
# merged_df = pd.concat([
#     app_usage, battery, bluetooth, call_log, data_traffic,
#     device_event, fitness, external_sensor, installed_app, 
#     key_log, location, media, message, notification, physical_activity,
#     physical_activity_transition, survey, wifi], ignore_index=True)
merged_df = embedded_sensor
print("Done")

print("extract emails from merged_df ...")
#Extract Email
for i in np.arange(0, len(merged_df), 1):
    merged_df.at[i, 'subject_email']=eval(merged_df['subject'][i])['email']
print("Done")

print("extract timestamps from merged_df ...")
#Extract Minute
merged_df['minute']=pd.to_datetime(merged_df['timestamp'], unit='ms').dt.tz_localize('UTC').dt.tz_convert('Asia/Seoul').dt.strftime('%y-%m-%d %H:%M')
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
print("Done")

print("save the result as [date/hour/minute]_cnt.csv files each ...")
date_cnt.to_csv("date_cnt.csv", mode='a', header=False)
hour_cnt.to_csv("hour_cnt.csv", mode='a', header=False)
minute_cnt.to_csv("minute_cnt.csv", mode='a', header=False)
# date_cnt.to_csv("date_cnt.csv", mode='w')
# hour_cnt.to_csv("hour_cnt.csv", mode='w')
# minute_cnt.to_csv("minute_cnt.csv", mode='w')
print("Done")


print("read csv files ...")
date_cnt = pd.read_csv('./date_cnt.csv')
print("Done")

datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DATA_TRAFFIC',
             'DEVICE_EVENT', 'FITNESS', 'EMBEDDED_SENSOR', 'EXTERNAL_SENSOR', 'INSTALLED_APP',
             'KEY_LOG', 'LOCATION', 'MEDIA', 'MESSAGE', 'NOTIFICATION', 'PHYSICAL_ACTIVITY',
             'PHYSICAL_ACTIVITY_TRANSITION', 'SURVEY', 'WIFI']

print("open resulting csv file ...")
f = open('daily_rowcount_res.csv', 'w')
wr = csv.writer(f)
wr.writerow(['email', 'day',
             'app_usage', 'battery', 'bluetooth', 'call_log', 'data_traffic',
             'device_event', 'fitness', 'embedded_sensor', 'external_sensor', 'installed_app',
             'key_log', 'location', 'media', 'message', 'notification', 'physical_activity',
             'physical_activity_transition', 'survey', 'wifi'])
print("Done")

print("calculate daily row count ...")
dates = date_cnt['date'].unique()
for date in dates:
    date_data = date_cnt[date_cnt['date'] == date]
    
    for user_num in range(1, 80):
        email_addr = 'iclab.drm' + str(user_num) + '@kse.kaist.ac.kr'
        user_data = date_data[date_data['subject_email'] == email_addr]

        res_list = [email_addr, date] + [0 for i in range(0, len(datumType))]

        for type in range(0, len(datumType)):
            for_each_type = user_data[user_data['datumType'] == datumType[type]]
            type_count = 0
            # print(for_each_type)
            if(len(for_each_type.values) > 0):
                for single_row in for_each_type.values:
                    if (len(single_row) >= 5 ):
                        type_count += single_row[4]
            res_list[type+2] = type_count
        wr.writerow(res_list)

print("Done")

f.close()