import pandas as pd
import csv

app_usage = pd.read_csv('./src/dataset/app_usage_event.csv')
battery = pd.read_csv('./src/dataset/battery.csv')
bluetooth = pd.read_csv('./src/dataset/bluetooth.csv')
call_log = pd.read_csv('./src/dataset/call_log.csv')
device_event = pd.read_csv('./src/dataset/device_event.csv')
media = pd.read_csv('./src/dataset/media.csv')
message = pd.read_csv('./src/dataset/message.csv')
physical_activity = pd.read_csv('./src/dataset/physical_activity.csv')
physical_activity_transition = pd.read_csv('./src/dataset/physical_activity_transition.csv')
survey = pd.read_csv('./src/dataset/survey.csv')

datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DEVICE_EVENT',
             'MEDIA', 'MESSAGE', 'PHYSICAL_ACTIVITY', 'PHYSICAL_ACTIVITY_TRANSITION', 'SURVEY']


f = open('rowcount_res.csv','w')
wr = csv.writer(f)
wr.writerow(['email', 'day',
             'app_usage', 'battery', 'bluetooth', 'call_log', 'device_event',
             'media', 'message', 'physical_activity', 'physical_activity_transition', 'survey'])

min_timestamp = 1637420400000
one_day_millis = 86400000
days_mills = [min_timestamp]
for i in range(1, 8):
    days_mills.append(days_mills[i-1] + one_day_millis)

merged = pd.concat([app_usage, battery, bluetooth, call_log, device_event, media, message, physical_activity, physical_activity_transition, survey], ignore_index=True)

for j in range(0, 7):
    day = merged[(days_mills[j] <= merged['timestamp']) & (merged['timestamp'] < days_mills[j+1])]

    for user_num in range(1, 80):
        email_addr = 'iclab.drm' + str(user_num) + '@kse.kaist.ac.kr'
        
        res_list = [email_addr, j+1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

        for k in range(0, len(datumType)):
            onetype = day[day['datumType'] == datumType[k]]

            subject = onetype['subject'].to_dict()
            if len(subject) > 0:
                for i in subject.keys():
                    subject[i] = eval(subject[i])
                subject = pd.DataFrame.from_dict(subject, orient='index')

                each_user = subject[subject['email'] == email_addr].count().reset_index()
                each_user.columns.values[1]='Count'
                res_list[k+2] = each_user.values[0][1]
        wr.writerow(res_list)

f.close()