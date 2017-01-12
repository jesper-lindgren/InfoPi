import RPi.GPIO as GPIO
import time
import json

btns_map = [26, 19]
btns_times = [0, 0]
btns_state = [0, 0]

DEBOUNCE_TIME = 100

leds_map = [6, 13]

def btnEventCB(channel):
	index = btns_map.index(channel)
	# print('Event! on pin ' + str(channel) + ' with index ' + str(index))
	# If the previous state was HIGH
	if btns_state[index] == 0:
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
		print(json.dumps(eventObj), flush=True)
	# Store the new btn state
	btns_state[btns_map.index(channel)] = GPIO.input(channel)

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# Setup btn0
GPIO.setup(btns_map[0], GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.add_event_detect(btns_map[0], GPIO.BOTH, callback=btnEventCB, bouncetime=DEBOUNCE_TIME)

# Setup btn1
GPIO.setup(btns_map[1], GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.add_event_detect(btns_map[1], GPIO.BOTH, callback=btnEventCB, bouncetime=DEBOUNCE_TIME)

# Setup led0
GPIO.setup(leds_map[0], GPIO.OUT, initial=GPIO.HIGH)

# Setup led1
GPIO.setup(leds_map[1], GPIO.OUT, initial=GPIO.HIGH)

# Setup led1

while True:
	time.sleep(10)
	# print('still running')
