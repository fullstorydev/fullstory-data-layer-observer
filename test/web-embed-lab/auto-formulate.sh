#!/bin/bash
set -e

rm -rf ./captures/*
rm -rf ./page-formulas/*
FRONT_END_DIST=../../node_modules/web-embed-lab/static/ auto-formulate ./auto-formulate.conf.json ./page-formulas/
