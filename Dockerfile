FROM node

RUN apt-get update \
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
        wmctrl

WORKDIR /app

ADD package.json package-lock.json /app/
RUN npm ci

ADD main.js entrypoint.sh /app/
ADD extension /app/extension/

CMD /app/entrypoint.sh
