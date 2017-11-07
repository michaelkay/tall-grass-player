#Overview#
The Tall Grass Player (TGP) is a mobile first client for MPD. It was specifically made to be super easy to use and for playing internet radio streams. Created to work like a radio in a car, it has very few features beyond the basics. 

##Prerequesits##
TGP is a hybrid web app which runs off a web server. The following must be installed to the app:
-Apache or lighttpd
-php
-php:PDO (should be included by defalt with PHP)
-PDO_SQLITE (should be included by default with PHP)
-MDP (needs to be installed somewhere)
For instructions on how to setup php with lighttpd see [this blog post](http://raspberrypimaker.com/installing-php-lighttpd-debian-stretch/)

##Installation##
Close the git repository or download and unzip in a web folder
In Linux, change the owner of the radio.db file so the web server user can alter the file
For example `chown www-data:www-data radio.db`
Download and install the dependant libraries
`cd vendor`
run `deps.sh` (linux) or `deps.bat` (windows)
If MPD is on a different server from the web server, the address in `api/init.php` should be altered.
NOTE: If MPD is on a different server, make sure the mdp.conf is edited to allow network access (set bind_to_address to "any").
Thats it!

#Use#
Using a phone or tablet, browse to TGP. It should pop up.
Click on a category to display the statons. Click on a station to play
To have TGP appear as an app on your phone, Use the 'Save to desktop' option in your browser.