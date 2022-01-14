import pandas as pd
import csv

print("read csv files ...")
merged_df = pd.read_csv('./merged_df.csv')
print("Done")

datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DATA_TRAFFIC',
             'DEVICE_EVENT', 'FITNESS', 'INSTALLED_APP', 'KEY_LOG', 'LOCATION',
             'MEDIA', 'MESSAGE', 'NOTIFICATION', 'PHYSICAL_ACTIVITY', 'PHYSICAL_ACTIVITY_TRANSITION',
             'SURVEY']

f = open('rowcount_res.csv','w')
wr = csv.writer(f)
wr.writerow(['email', 'day',
             'app_usage', 'battery', 'bluetooth', 'call_log', 'data_traffic',
             'device_event', 'fitness', 'installed_app', 'key_log', 'location',
             'media', 'message', 'notification', 'physical_activity', 'physical_activity_transition',
             'survey'])

dates = merged_df['date'].unique()
for date in dates:
    date_data = merged_df[merged_df['date'] == date]
    # print(date_data)
    for user_num in range(1, 80):
        email_addr = 'iclab.drm' + str(user_num) + '@kse.kaist.ac.kr'
        user_data = date_data[date_data['subject_email'] == email_addr]
        # print("user number "+str(user_num)+"'s data of the date "+str(date))
        # print(user_data)

        res_list = [email_addr, date] + [0 for i in range(0, len(datumType))]

        for type in range(0, len(datumType)):
            for_each_type = user_data[user_data['datumType'] == datumType[type]]
            type_count = 0
            if(len(for_each_type.values) > 0):
                if (len(for_each_type.values[0]) >= 5 ):
                    type_count = for_each_type.values[0][4]
            res_list[type+2] = type_count
        wr.writerow(res_list)

f.close()