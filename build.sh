#! /usr/bin/bash

CURRENT_PID=$(lsof -ti  tcp:3030)

echo ">> 기존 실행 중인 애플리케이션을 확인합니다."

if [ -z "$CURRENT_PID"] ; then
    echo ">> 현재 3000번 port에서 실행 중인 애플리케이션이 없습니다."

else
    echo ">> 현재 PID $CURRENT_PID 번에서 실행중인 애플리케이션이 있어 종료합니다."
    kill -15 $CURRENT_PID
    echo ">> 2초 sleep"
    sleep 2

fi

echo ">> GitHub에서 최신 버전을 가져옵니다"

git pull

echo ">> 새로 설치할 NPM 패키지를 확인합니다."

npm i --only=prod

echo ">> nohup으로 애플리케이션을 실행합니다."

nohup npm start 2>&1 & 

disown 

echo ">> 배포 스크립트 실행을 종료합니다."
