# -*- coding: utf-8 -*-
from pymongo import MongoClient
from bson import json_util
import csv
import sys
reload(sys)
sys.setdefaultencoding("UTF-8")

user_id = "abcreader"
password = "abcreader"
mongodb_URI = "mongodb://%s:%s@abc.kaist.ac.kr:50031" % (user_id, password)
client = MongoClient(mongodb_URI)

print(client.list_database_names()) # >>> ['abc']

db = client.abc
collection = db.datum

# The below query is one example to read SURVEY data from one subject.
query = {
    "$and": [{
        # "datumType": "SURVEY" # MANDATORY; choose one among the below list (see POSSIBLE datumType).
        "datumType": "EMBEDDED_SENSOR"
    }, {
        "subject.groupName": "EG" # MANDATORY; do not change this line.
    }, {
        # "subject.email": "iclab.drm1@kse.kaist.ac.kr" # iclab.drm###@kse.kaist.ac.kr (###: 1 ~ 135)
        # exclude this condition if you want to get data from all subjects. (don't need to specify one subject)
    }, {
        # "timestamp": { "$exists": "true" } # MANDATORY; if you want to read the data for all time.
        
        ### other examples ###
        # 1)
        # "timestamp": { "$gt": 1637506800000 } # "$gt" means "greater than". 
        # Timestamp in milliseconds: 1637506800000
        # Date and time (GMT): 2021년 November 21일 Sunday PM 3:00:00
        # Date and time (your time zone): 2021년 11월 22일 월요일 오전 12:00:00 GMT+09:00# 2)
        # "timestamp": { "$lt": 1637506800000 } # "$lt" means "less than".
        # Timestamp in milliseconds: 1641913200000
        # Date and time (GMT): 2022년 January 11일 Tuesday PM 3:00:00
        # Date and time (your time zone): 2022년 1월 12일 수요일 오전 12:00:00 GMT+09:00
        #
        # you can use the conditions twice, e.g., {"timestamp": {"$gt": 0}}, {"timestamp": {"$lt": 5}}
        # you can convert the local time to timestamp (and vice versa) via here: https://www.epochconverter.com/
        # you need to use local time 00:00 ~ 23:59 to read daily results.
    }, {"timestamp": {"$gt": 1637420400000}}, {"timestamp": {"$lt": 1638025200000}}, {
        # "value.responseTime": { "$gt": 0 }  
        # exclude this condition if you read other datumType.
        # use this condition only for querying SURVEY data.
    }]
}

### POSSIBLE datumType ###
"""
PHYSICAL_ACTIVITY_TRANSITION = 1;
PHYSICAL_ACTIVITY = 2;
APP_USAGE_EVENT = 3;
BATTERY = 4;
BLUETOOTH = 5;
CALL_LOG = 6;
DEVICE_EVENT = 7;
EMBEDDED_SENSOR = 8;
EXTERNAL_SENSOR = 9;
INSTALLED_APP = 10;
KEY_LOG = 11;
LOCATION = 12;
MEDIA = 13;
MESSAGE = 14;
NOTIFICATION = 15;
FITNESS = 16;
SURVEY = 17;
DATA_TRAFFIC = 18;
WIFI = 19;
"""


print("query from DB ...  ")
# you can study the query method here: https://docs.mongodb.com/manual/reference/method/db.collection.find/
# the type of the resulting query is dict.
# test_result = collection.find_one(query) # you can use find_one method to test query result.
all_data = list(collection.find(query)) #  or you can use find method to read all matched results.
print("Done")
# pprint.pprint(test_result, indent=2)
# with open("wifi_test_result.json", "w") as f:
#   json.dump(test_result, f, indent=2, default=json_util.default)

# import and save the data from DB firstly as json file
# print("import as json ...  ")
# with open("call_log.json", "w") as f:
#   json.dump(all_data, f, indent=2, default=json_util.default, ensure_ascii=False)
# print("Done")
    
print("convert to csv ...  ")
with open("embedded_sensor.csv", "w") as output_file:
    dict_writer = csv.DictWriter(output_file, all_data[0].keys())
    dict_writer.writeheader()
    dict_writer.writerows(all_data)
print("Done")

# the below example is one row of SURVEY data.
"""
{ '_id': ObjectId('619d9a6f2073781c558079e8'),
  'datumType': 'SURVEY',
  'offsetTimestamp': datetime.datetime(2021, 11, 24, 1, 46, 5),
  'offsetUploadTime': datetime.datetime(2021, 11, 24, 1, 50, 38),
  'subject': { 'appId': 'kaist.iclab.abclogger',
               'appVersion': '0.9.9-omicron',
               'deviceManufacturer': 'samsung',
               'deviceModel': 'SM-A516N',
               'deviceOs': 'Android-30',
               'deviceVersion': '11',
               'email': 'iclab.drm1@kse.kaist.ac.kr',
               'groupName': 'EG',
               'hashedEmail': 'b7eaf94f284ebaf3b7fe5d64ebb9058b',
               'instanceId': 'fWuGgINsRKGe4WS3DVs4Yz',
               'source': 'SMARTPHONE'},
  'timestamp': 1637718365009,
  'uploadTime': 1637718638358,
  'utcOffsetSec': 32400,
  'value': { 'actualTriggerTime': 1637718007012,
             'altInstruction': '설문 응답을 하기 직전을 기준으로, 다음과 같은 감정을 어느 정도 느꼈습니까?',
             'altMessage': '설문에 응답해주세요',
             'altTitle': '감정 설문이 도착했습니다',
             'eventName': '4b57be0e-56df-40d8-8320-5e27637027a1',
             'eventTime': -9223372036854775808,
             'instruction': '설문 응답을 하기 직전을 기준으로, 다음과 같은 감정을 어느 정도 느꼈습니까?',
             'intendedTriggerTime': 1637718007000,
             'message': '설문에 응답해주세요',
             'reactionTime': 1637718323396,
             'response': [ { 'altQuestion': '행복한 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                            '그렇다.)',
                             'answer': ['4.0', ''],
                             'index': 0,
                             'question': '1. 행복한 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                         '그렇다.)',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': '평온한 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                            '그렇다.)',
                             'answer': ['4.0', ''],
                             'index': 1,
                             'question': '2. 평온한 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                         '그렇다.)',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': '즐거운 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                            '그렇다.)',
                             'answer': ['4.0', ''],
                             'index': 2,
                             'question': '3. 즐거운 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                         '그렇다.)',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': '만족하는 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                            '그렇다.)',
                             'answer': ['5.0', ''],
                             'index': 3,
                             'question': '4. 만족하는 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                         '그렇다.)',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': '슬픈 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                            '그렇다.)',
                             'answer': ['2.0', ''],
                             'index': 4,
                             'question': '5. 슬픈 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                         '그렇다.)',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': '불안한 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                            '그렇다.)',
                             'answer': ['1.0', ''],
                             'index': 5,
                             'question': '6. 불안한 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                         '그렇다.)',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': '우울한 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                            '그렇다.)',
                             'answer': ['1.0', ''],
                             'index': 6,
                             'question': '7. 우울한 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                         '그렇다.)',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': '화난 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                            '그렇다.)',
                             'answer': ['1.0', ''],
                             'index': 7,
                             'question': '8. 화난 (전혀 그렇지 않다 ~ 보통이다 ~ 매우 많이 '
                                         '그렇다.)',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': 'My emotion right before doing '
                                            'this survey could be rated as',
                             'answer': ['1.0', ''],
                             'index': 8,
                             'question': '9. 이 설문 응답 직전에, 내 감정은',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': 'My emotion right before doing '
                                            'this survey could be rated as',
                             'answer': ['1.0', ''],
                             'index': 9,
                             'question': '10. 이 설문 응답 직전에, 내 감정은',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': 'My stress level right before '
                                            'doing this survey could be rated '
                                            'as',
                             'answer': ['1.0', ''],
                             'index': 10,
                             'question': '11. 이 설문 응답 직전에, 내 스트레스 상태는',
                             'type': 'LINEAR_SCALE'},
                           { 'altQuestion': 'Did answering this survey disturb '
                                            'the activity that I was '
                                            'performing before doing it?',
                             'answer': ['2.0', ''],
                             'index': 11,
                             'question': '12. 설문 응답 행위가 설문 응답 직전에 하던 행동을 '
                                         '방해했습니까?',
                             'type': 'LINEAR_SCALE'}],
             'responseTime': 1637718364764,
             'timeoutAction': 'DISABLED',
             'timeoutUntil': 1637718907000,
             'title': '감정 설문이 도착했습니다',
             'url': 'https://bit.ly/3oQLsnU'}}
"""