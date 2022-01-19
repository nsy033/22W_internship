import pandas as pd
import numpy as np
import csv

print("read csv files ...")
message = pd.read_csv('./dataset/message.csv')
print("Done")

print("concat individual dataframes into merged_df ...")
# merged_df = pd.concat([
#     app_usage, battery, bluetooth, call_log, data_traffic,
#     device_event, fitness, embedded_sensor, external_sensor, installed_app, 
#     key_log, location, media, message, notification, physical_activity,
#     physical_activity_transition, survey, wifi], ignore_index=True)
merged_df = message
print("Done")

print("extract emails and each deviceOS from merged_df ...")
#Extract Email
for i in np.arange(0, len(merged_df), 1):
    merged_df.at[i, 'subject_email']=eval(merged_df['subject'][i])['email']
    merged_df.at[i, 'deviceOs']=eval(merged_df['subject'][i])['deviceOs']
print("Done")

print("group by each subject_email, deviceOS ...")
grouped = pd.DataFrame(
    data = {
        'subject_email': merged_df['subject_email'],
        'deviceOs': merged_df['deviceOs']
    })
print("Done")

f = open('extract_os_res.csv', 'w')
wr = csv.writer(f)
wr.writerow(['email', 'deviceOs'])

for user_num in range(1, 80):
    email_addr = 'iclab.drm' + str(user_num) + '@kse.kaist.ac.kr'
    user_data = grouped[grouped['subject_email'] == email_addr]
    device_os = ''
    if(len(user_data['deviceOs'].values) > 0):
        device_os = user_data['deviceOs'].values[0]

    res_list = [email_addr, device_os]
    wr.writerow(res_list)

f.close()