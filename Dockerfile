FROM buildkite/puppeteer:latest

RUN apt-get -qq update \
    && apt-get install -y --no-install-recommends \
        xvfb \
        x11vnc \
        fluxbox \
        wmctrl \
        pulseaudio \
        pavucontrol

RUN adduser root pulse-access

WORKDIR /app

ADD main.js entrypoint.sh /app/
ADD extension /app/extension/

CMD /app/entrypoint.sh
