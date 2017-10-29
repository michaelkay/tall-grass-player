#!/bin/bash
cd files/
rm -f *.zip
wget -q https://github.com/slimphp/Slim/archive/2.6.3.zip
unzip -o -q 2.6.3.zip
cp -Rf Slim-2.6.3/Slim/* ../../api/Slim
wget -q https://github.com/twbs/ratchet/releases/download/v2.0.2/ratchet-2.0.2-dist.zip
unzip -o -q ratchet-2.0.2-dist.zip
cp -f ratchet-v2.0.2/js/ratchet.min.js ../js
cp -f ratchet-v2.0.2/fonts/* ../fonts
wget -q https://github.com/blueimp/JavaScript-Templates/archive/v3.11.0.zip
unzip -o -q v3.11.0.zip
cp -f JavaScript-Templates-3.11.0/js/tmpl.min.js ../js
wget -q https://github.com/RubaXa/Sortable/archive/1.4.0.zip
unzip -o -q 1.4.0.zip
cp -f Sortable-1.4.0/Sortable.min.js ../js
wget -q https://github.com/michaelkay/cookies.js/archive/0.1.zip
unzip -o -q 0.1.zip
cp -f cookies.js-0.1/cookies_min.js ../js
