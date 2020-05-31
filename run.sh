docker build -t recorder .
docker run \
    -p 5900:5900 \
    -v /dev/snd:/dev/snd \
    --privileged \
    -v /tmp/recordings:/tmp/recordings \
    -it \
    recorder