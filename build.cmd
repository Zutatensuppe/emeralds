@echo off



echo;
echo;
echo ---------------------------------------
echo Minifying Js
echo ---------------------------------------
echo uglifyjs --compress --mangle --mangle-props --mangle-regex="/^_/" --o src/game.min.js -- src/game.js
call uglifyjs --compress --mangle --mangle-props --mangle-regex="/^_/" --o src/game.min.js -- src/game.js



echo;
echo;
echo ---------------------------------------
echo Creating Zip
echo ---------------------------------------
echo rm dist/dist.zip
call rm dist/dist.zip
echo 7za a -mm=PPMd -mtc=off -mx9 dist/dist.zip src/game.min.js src/index.html src/sprites.png src/lib/jsfxr.min.js src/lib/sequencer.min.js
call 7za a -mm=PPMd -mtc=off -mx9 dist/dist.zip src/game.min.js src/index.html src/sprites.png src/lib/jsfxr.min.js src/lib/sequencer.min.js



echo;
echo;
echo ---------------------------------------
echo Summary
echo ---------------------------------------
set size=0
set sizelimit=13312
call :filesize dist/dist.zip
if %size% LEQ %sizelimit% (
echo File Size: %size% ^<= %sizelimit% ^(Ok^!^)
) else (
echo File Size: %size% ^> %sizelimit% ^(Warning, limit exceeded^!^)
)
goto :eof


:filesize
  set size=%~z1
  exit /b 0