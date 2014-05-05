FROM ubuntu:14.04

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update
RUN apt-get upgrade -y

RUN apt-get install -yq mongodb
RUN apt-get install -yq nodejs npm git
RUN apt-get install -yq python-setuptools python-dev

RUN git clone --depth=1 https://github.com/ethereum/serpent.git
RUN git clone --depth=1 https://github.com/ethereum/pyethereum.git
RUN git clone --depth=1 https://github.com/ethereum/tryethereum.git

RUN cd serpent && python setup.py install
RUN cd pyethereum && python setup.py install
RUN cd tryethereum && npm install

CMD service mongodb start && (until mongo --eval true; do sleep 1; done;) && cd tryethereum && nodejs server.js
