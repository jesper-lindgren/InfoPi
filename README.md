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
sudo apt-get install -y nodejs vim samba xinput git
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