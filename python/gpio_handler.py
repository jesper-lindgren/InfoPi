import RPi.GPIO as GPIO
import time
import json

btns_map = [26]
btns_times = [0]
btns_state = [1]

def btnEventCB(channel):
	index = btns_map.index(channel)
	# print('Event! on pin ' + str(channel) + ' with index ' + str(index))
	# If the previous state was HIGH
	if btns_state[index] == 1:
		# Store the start time
		btns_times[index] = time.time()
	else:
		# Check how long the btn was pressed
		pressed = time.time() - btns_times[index]
		eventObj = {'eventType': 'buttonPressed', 'subtype': '', 'buttonIndex': index}
		if pressed > 2:
			eventObj['subtype'] = 'longPress'
			# print('Long press (> 2 s)')
		else:
			eventObj['subtype'] = 'shortPress'
			# print('Short press (< 2 s)')
		print(json.dumps(eventObj))
	# Store the new btn state
	btns_state[btns_map.index(channel)] = GPIO.input(channel)

GPIO.setmode(GPIO.BCM)
GPIO.setup(26, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(26, GPIO.BOTH, callback=btnEventCB, bouncetime=50)

while True:
	time.sleep(10)
	# print('still running')