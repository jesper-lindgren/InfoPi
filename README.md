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

