sudo rm -rf /tmp/recordings
docker build -t recorder .
docker run \
    -p 5900:5900 \
    -v /tmp/recordings:/tmp/recordings \
    -it \
    recorder
cat $(ls -tr /tmp/recordings/** | xargs) > /tmp/record.webm
vlc /tmp/record.webm
