#!/bin/bash
killall ngrok
set -e

FRONT_END_DIST=../../node_modules/web-embed-lab/static/ runner ./page-formulas/ ./test-probes/ ../../build/dlo.js ./runner.conf.json

set +e
killall ngrok
echo "Finished test"