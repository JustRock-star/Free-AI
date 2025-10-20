#!/bin/bash
ZIPNAME="fake-ai-demo.zip"
rm -f $ZIPNAME
zip -r $ZIPNAME public firebase.json functions package.json
echo "Created $ZIPNAME"
