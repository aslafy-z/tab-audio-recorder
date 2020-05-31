
sudo rm -rf /tmp/recordings || true
docker build -t recorder .
docker run \
    -p 5900:5900 \
    -v /tmp/recordings:/tmp/recordings \
    -it \
    recorder 

find /tmp/recordings -type f \
    | xargs stat -c '%Y %n' \
    | sort \
    | awk '{print $2}' \
    | xargs cat \
    > /tmp/record.webm \
    && \
    sudo rm -rf /tmp/recordings
yes | ffmpeg \
    -hide_banner -loglevel panic \
    -i /tmp/record.webm \
    -acodec copy \
    /tmp/out_stereo.wav \
    && \
    rm /tmp/record.webm
yes | ffmpeg \
    -hide_banner -loglevel panic \
    -i /tmp/out_stereo.wav \
    -ac 1 \
    /tmp/out_mono.wav \
    && \
    rm /tmp/out_stereo.wav

vlc /tmp/out_mono.wav
