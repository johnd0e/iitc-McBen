#!/bin/sh

./build.py $*
./copybuild2firefox.rb 
FORMAT=$(echo "\033[1;33m%w%f\033[0m written")
while inotifywait -qre close_write --format "$FORMAT" . @./build/ @./mobile/bin/ @./mobile/gen/ @./.git/
do
  ./build.py $*
  ./copybuild2firefox.rb 
done

