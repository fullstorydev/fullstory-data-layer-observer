#!/bin/bash
killall ngrok
set -e

ngrok http -config=./ngrok-auto-formulate-config.yml -subdomain=dlowel 8080 &

rm -rf ./captures/*
rm -rf ./page-formulas/*
FRONT_END_DIST=../../node_modules/web-embed-lab/static/ auto-formulate ./auto-formulate.conf.json ./page-formulas/

set +e
killall ngrok