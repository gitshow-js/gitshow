#!/bin/sh

if [ $# -lt 1 ]; then
    echo "Usage: gitshow.sh <command> [<source_path>]"
    echo "Commands: "
    echo "  serve -- run live server"
    echo "  package -- package the complete presentation"
    echo "  pdf -- create PDF"
    exit 1
fi

DESTDIR="./dist"
CMD="$1"
GSDIR="`dirname -- $0`"
if [ $# -eq 1 ]; then
    SRCDIR=`pwd`
else
    SRCDIR="$2"
fi

if [ ! -f "$SRCDIR/presentation.json" ]; then
    echo "No presentation config file (presentation.json) found in $SRCDIR"
    exit 2
fi

cd $GSDIR
if [ ! -d "node_modules" ]; then
    npm install
fi
echo "Using source directory: $SRCDIR"
rm -rf "$DESTDIR"

case $CMD in
    serve)
        npm run build -- --src="$SRCDIR" --dest="$DESTDIR"
        npm start -- --src="$SRCDIR" --dest="$DESTDIR"
        ;;
    package)
        npm run build -- --src="$SRCDIR" --dest="$DESTDIR"
        ;;
    pdf)
        npm run build -- --src="$SRCDIR" --dest="$DESTDIR"
        npm run pdf -- --src="$SRCDIR" --dest="$DESTDIR"
        ;;
    *)
        echo "Unknown command: $CMD"
        exit 3
        ;;
esac
