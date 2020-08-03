#!/usr/bin/env bash

docker build -t fotrino-films-frontend .
docker save fotrino-films-frontend >fotrino-films-frontend.tar
rsync -avzh fotrino-films-frontend.tar droplet:
