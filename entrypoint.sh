#!/bin/bash

launch_xvfb() {
    # Set defaults if the user did not specify envs.
    export DISPLAY=${XVFB_DISPLAY:-:1}
    local screen=${XVFB_SCREEN:-0}
    local resolution=${XVFB_RESOLUTION:-1280x1024x24}
    local timeout=${XVFB_TIMEOUT:-5}

    # Start and wait for either Xvfb to be fully up or we hit the timeout.
    Xvfb ${DISPLAY} -screen ${screen} ${resolution} >/dev/null 2>&1 &
    local loopCount=0
    until xdpyinfo -display ${DISPLAY} > /dev/null 2>&1
    do
        loopCount=$((loopCount+1))
        sleep 1
        if [ ${loopCount} -gt ${timeout} ]
        then
            echo "${G_LOG_E} xvfb failed to start."
            exit 1
        fi
    done
}

launch_window_manager() {
    local timeout=${XVFB_TIMEOUT:-5}

    # Start and wait for either fluxbox to be fully up or we hit the timeout.
    fluxbox >/dev/null 2>&1 &
    local loopCount=0
    until wmctrl -m > /dev/null 2>&1
    do
        loopCount=$((loopCount+1))
        sleep 1
        if [ ${loopCount} -gt ${timeout} ]
        then
            echo "${G_LOG_E} fluxbox failed to start."
            exit 1
        fi
    done
}

run_vnc_server() {
    local passwordArgument='-nopw'
    if [ -n "${VNC_SERVER_PASSWORD}" ]
    then
        local passwordFilePath="${HOME}/x11vnc.pass"
        if ! x11vnc -storepasswd "${VNC_SERVER_PASSWORD}" "${passwordFilePath}"
        then
            echo "[ERROR] Failed to store x11vnc password."
            exit 1
        fi
        passwordArgument=-"-rfbauth ${passwordFilePath}"
        echo "[INFO] The VNC server will ask for a password."
    else
        echo "[WARN] The VNC server will NOT ask for a password."
    fi
    x11vnc -display ${DISPLAY} -forever ${passwordArgument} >/dev/null 2>&1 &
    wait $!
}

run_pulseaudio_server() {
    rm -rf /var/run/pulse /var/lib/pulse /root/.config/pulse
    pulseaudio -D --exit-idle-time=-1 --system --disallow-exit
    echo "Creating virtual audio source: "
    pactl load-module module-virtual-source master=auto_null.monitor format=s16le source_name=VirtualMic
    echo "Setting default source: "
    pactl set-default-source VirtualMic
    pavucontrol >/dev/null 2>&1 &
    # pactl set-source-mute 1 1
}

control_c() {
    echo ""
    exit
}
trap control_c SIGINT SIGTERM SIGHUP

launch_xvfb
launch_window_manager
run_vnc_server &
run_pulseaudio_server

# env DEBUG="puppeteer:*" node export.js 2>&1 | grep -v '"Network'
node main.js
