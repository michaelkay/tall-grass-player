cd files/
del /q *.zip
powershell.exe -Command (new-object System.Net.WebClient).DownloadFile('https://github.com/slimphp/Slim/archive/2.6.3.zip','2.6.3.zip')
rmdir Slim-2.6.3 /Q/S
powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::ExtractToDirectory('2.6.3.zip', '.'); }"
xcopy Slim-2.6.3\Slim ..\..\api\Slim /E/Q/Y
powershell.exe -Command (new-object System.Net.WebClient).DownloadFile('https://github.com/twbs/ratchet/releases/download/v2.0.2/ratchet-2.0.2-dist.zip','ratchet-2.0.2-dist.zip')
rmdir ratchet-v2.0.2 /Q/S
powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::ExtractToDirectory('ratchet-2.0.2-dist.zip', '.'); }"
xcopy ratchet-v2.0.2\js\ratchet.min.js ..\js /Q/Y/E
xcopy ratchet-v2.0.2\fonts ..\fonts /E/Q/Y
powershell.exe -Command (new-object System.Net.WebClient).DownloadFile('https://github.com/blueimp/JavaScript-Templates/archive/v3.11.0.zip','v3.11.0.zip')
rmdir JavaScript-Templates-3.11.0 /Q/S
powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::ExtractToDirectory('v3.11.0.zip', '.'); }"
xcopy JavaScript-Templates-3.11.0\js\tmpl.min.js ..\js /Q/Y
powershell.exe -Command (new-object System.Net.WebClient).DownloadFile('https://github.com/RubaXa/Sortable/archive/1.4.0.zip','1.4.0.zip')
rmdir Sortable-1.4.0 /Q/S
powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::ExtractToDirectory('1.4.0.zip', '.'); }"
xcopy Sortable-1.4.0\Sortable.min.js ..\js /Q/Y
powershell.exe -Command (new-object System.Net.WebClient).DownloadFile('https://github.com/michaelkay/cookies.js/archive/0.1.zip','0.1.zip')
rmdir cookies.js-0.1 /Q/S
powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::ExtractToDirectory('0.1.zip', '.'); }"
xcopy cookies.js-0.1\cookies_min.js ..\js /Q/Y
