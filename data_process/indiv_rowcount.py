import pandas as pd
import csv

print("read csv files ...")
hour_cnt = pd.read_csv('./hour_cnt.csv')
print("Done")

datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DATA_TRAFFIC',
             'DEVICE_EVENT', 'FITNESS', 'EXTERNAL_SENSOR', 'INSTALLED_APP', 'KEY_LOG',
             'LOCATION', 'MEDIA', 'MESSAGE', 'NOTIFICATION', 'PHYSICAL_ACTIVITY',
             'PHYSICAL_ACTIVITY_TRANSITION', 'SURVEY', 'WIFI']

f = open('daily_rowcount_res.csv','w')
wr = csv.writer(f)
wr.writerow(['email', 'day',
             'app_usage', 'battery', 'bluetooth', 'call_log', 'data_traffic',
             'device_event', 'fitness', 'external_sensor', 'installed_app', 'key_log',
             'location', 'media', 'message', 'notification', 'physical_activity',
             'physical_activity_transition', 'survey', 'wifi'])

dates = hour_cnt['date'].unique()
hours = hour_cnt['hour'].unique()
for date in dates:
    date_data = hour_cnt[hour_cnt['date'] == date]
    for user_num in range(1, 80):
        email_addr = 'iclab.drm' + str(user_num) + '@kse.kaist.ac.kr'
        user_data = date_data[date_data['subject_email'] == email_addr]

        for hour in hours:
            res_list = [email_addr, date, hour] + [0 for i in range(0, len(datumType))]
            for_each_hour = user_data[user_data['hour'] == hour]

            if len(for_each_hour) > 0:
                for type in range(0, len(datumType)):
                    for_each_type = for_each_hour[for_each_hour['datumType'] == datumType[type]]
                    type_count = 0
                    if(len(for_each_type.values) > 0):
                        if (len(for_each_type.values[0]) >= 6 ):
                            type_count = for_each_type.values[0][5]
                    res_list[type+2] = type_count
            wr.writerow(res_list)

f.close()