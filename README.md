# InfoPi

## Main package installation
Station setup
```
sudo apt-get update
sudo apt-get dist-upgrade
```

Install practical packages
```
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs vim samba xinput git xdotool
```

## Setup samba
Create a samba profile by making a public directory, and then editing ```smb.conf```
```
mkdir ~/Public
sudo vim /etc/samba/smb.conf
```
Add the following at the bottom
```
[InfoPi Public]
 comment = InfoPi Public
 path = /home/pi/Public
 browseable = Yes
 writeable = Yes
 only guest = No
 create mask = 0740
 directory mask = 0750
 public = no
```
After that you need to create a samba user (*username* is the chosen username)
```
sudo smbpasswd -a username
```
After this you can reach it from the network using ```//InfoPi```

## Display setup
In order to rotate the display 90/270 degrees, add the following to ```/boot/config```
```
display_rotate=270
```
This will rotate the display, it will not however rotate the touch interface. In order to do so, add the following to ```~/.config/lxsession/LXDE-pi/autostart```
```
@xset s noblank
@xset s off
@xset -dpms
@/home/pi/screenflip.sh
```
This will also disaple screen blanking (the screensaver). The contents of ```screenflip.sh``` should be
```
export DISPLAY=:0
xinput set-prop 'FT5406 memory based driver' 'Evdev Axes Swap' 1
xinput --set-prop 'FT5406 memory based driver' 'Evdev Axis Inversion' 1 0
```

## Autostart browser in kiosk mode
Use the chromium-browser and create a script ```start_infopi_kiosk.sh``` containing 
```
chromium-browser --kiosk http://localhost:3000
```
and make the script executable using 
```
chmod +x start_infopi_kiosk.sh
```
Then add the script to the LXDE autostart as we did above with the screen rotation and screen blanking. The file should now include all following lines
```
@xset s noblank
@xset s off
@xset -dpms
@/home/pi/Documents/Projects/InfoPi/scripts/screenflip.sh
@/home/pi/Documents/Projects/InfoPi/scripts/start_infopi_kiosk.sh
```

In order to have anything to show, the node server must be running. Add the following line to ```/etc/rc.local```
```
/home/pi/Documents/Projects/InfoPi/start_infopi_server.sh > /home/pi/Documents/Projects/InfoPi/infopi-server.log 2>&1 &
```
This will run the script ```start_infopi_server.sh``` upon boot, and pipe both stderr and stdout to the file ```infopi-server.log```  

Don't forget to make script executable!
```
chmod +x start_infopi_server.sh
```

In order to hide the cursor from showing, make sure that ```unclutter``` is installed, and add the following to the ```autostart``` file.
```
@unclutter -idle 0.1 root
```

The browser can be refreshed by running the script ```scripts/refresh_browser.sh```
```
export DISPLAY=:0
WID=$(xdotool search --onlyvisible --class chromium|head -1)
xdotool windowactivate ${WID}
xdotool key ctrl+F5
```

## Installing webcam utilities
In order to experiment with the picamera, the RPi-Cam-Web-Interface can be used. It is installed by the following commands
```
git clone https://github.com/silvanmelchior/RPi_Cam_Web_Interface.git
cd RPi_Cam_Web_Interface
chmod u+x *.sh
./install.sh
```

## BLE support
It requires more exeriments to manage to enable the BLE support for InfoPi. Install the ```noble``` package by
```
sudo apt-get install bluetooth bluez-utils libbluetooth-dev
npm install --save noble
```

```
https://github.com/sandeepmistry/noble
https://labs.hybris.com/2014/10/06/connecting-to-multiple-ble-devices/
```
