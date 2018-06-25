@ECHO off
ECHO autobuild running
rem "inotifywait" required: https://github.com/thekid/inotify-win

start yarn start

:loop
build.py local
IF ERRORLEVEL 1 GOTO continue

:continue
inotifywait -q -r --format "%%e:%%w\\%%f" . @./build/ @./mobile/bin/ @./mobile/gen/ @./.git/
GOTO loop

