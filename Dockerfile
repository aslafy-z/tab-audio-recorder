FROM node
    # apt-get install -y software-properties-common && \
RUN apt-get update && \
    apt-get install -y software-properties-common apt-transport-https ca-certificates && \
    apt-get install wget && \
    echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    apt-get update

RUN apt-get update && \
    apt-get install -y \
        curl \
        gcc \
        g++ \
        make \
        xvfb \
        google-chrome-stable \
        libgbm-dev \
        libatk-bridge2.0-0 \
        libgtk-3-0 \
        fluxbox \
        wmctrl

# RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
# RUN apt-get install -y nodejs

# RUN apt-get install -y \

# FROM node
# RUN apt-get update && \
#     apt-get install -y \
#         xvfb \
#         libxtst6 \
#         libnss3 \
#         libatk-bridge2.0-0 \
#         libxss1 \
#         libgbm-dev \
#         libasound2 \
#         libgtk-3-0 \
#         dbus-x11 packagekit-gtk3-module libcanberra-gtk-module
WORKDIR /app
ADD package.json package-lock.json /app/
RUN npm i
ADD export.js run.sh /app/
ADD extension/ /app/
CMD /app/run.sh