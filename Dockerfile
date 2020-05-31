FROM buildkite/puppeteer:latest

RUN apt-get -qq update \
    && apt-get install -y \
        curl \
        gcc \
        g++ \
        make \
        xvfb \
        x11vnc \
        chromium \
        libgbm-dev \
        libatk-bridge2.0-0 \
        libgtk-3-0 \
        fluxbox \
        wmctrl \
        pulseaudio

RUN adduser root pulse-access

WORKDIR /app

ADD main.js entrypoint.sh /app/
ADD extension /app/extension/

CMD /app/entrypoint.sh
