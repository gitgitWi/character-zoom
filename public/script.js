const ROOM_ID = window.location.pathname;
const socket = io("/");
const selectQuery = (ele) => document.querySelector(ele);
const selectID = (ele) => document.getElementById(ele);

const questionBtn = selectID("controls__question");
const presentationBtn = selectID("controls__presentation");
const noticeBtn = selectID("controls_notice");

const randomNames = [
    "도우도우",
    "마카",
    "로니",
    "제페토",
    "스윗라이프",
    "몰랑이",
    "이기영",
    "이기철",
    "땡구",
];

const myPeer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3030",
});

const peers = {};

let myVideoStream;
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
};

const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });
    call.on("close", () => {
        video.remove();
    });

    peers[userId] = call;
};

const scrollToBottom = () => {
    const d = $(".main__chat_window");
    d.scrollTop(d.prop("scrollHeight"));
};

const setMuteButton = () => {
    const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>`;
    selectQuery(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
    const html = `<i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>`;
    selectQuery(".main__mute_button").innerHTML = html;
};

const setStopVideo = () => {
    const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>`;
    selectQuery(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
    `;
    selectQuery(".main__video_button").innerHTML = html;
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const removeDiv = (ele, seconds = 3000) => {
    setTimeout(() => {
        document.body.removeChild(ele);
    }, seconds);
};

const createCharacterDiv = (type) => {
    const gifDiv = document.createElement("div");
    gifDiv.classList.add("character");
    const characterGif = `./imgs/${type}.gif`;
    gifDiv.innerHTML = `<img src=${characterGif} />`;
    document.body.appendChild(gifDiv);
    removeDiv(gifDiv);
};

const addTodo = () => {
    if (window.event.keyCode !== 13) return;

    const newTodoInput = selectID("notice__list__insert_new");
    const newTodo = newTodoInput.value;
    const newTodoLi = document.createElement("li");
    newTodoLi.innerText = newTodo;

    const todoList = selectID("notice__list__list");
    todoList.appendChild(newTodoLi);
    newTodoInput.value = "";

    const todoListDiv = selectQuery(".notice__list__teachers");
    todoListDiv.scrollTop = todoListDiv.scrollHeight;
};

const noticeHtml = `<div class="notice__header">
<span>알림장</span>
<img src="./imgs/notice.gif" />
</div>
<div class="notice__list">
<div class="notice__list__teachers">
    <ul id="notice__list__list">
        <li>가정통신문 부모님께 꼭 가져다 드리기!</li>
        <li>국어 교과서 220쪽 문제 다시풀기!</li>
        <li>본인이 좋아하는 소설가 1명에 대해 조사하기</li>
    </ul>
</div>
<div class="notice__list__user_add">
    <input
        type="text"
        id="notice__list__insert_new"
        onkeyup = "addTodo()"
        placeholder="추가할 알림 내용이 있으면 적어주세요"
    />
</div>
</div>`;

const createNoticeDiv = () => {
    const noticeDiv = document.createElement("div");
    noticeDiv.innerHTML = noticeHtml;
    noticeDiv.classList.add("notice");
    document.body.appendChild(noticeDiv);
    removeDiv(noticeDiv, 60 * 1000 * 5);
};

// TODO:
const addCharacterMotionController = (event) => {
    // 현재 target id에 따라 액션, 위치 설정
    const { currentTarget } = event;
    switch (currentTarget.id) {
        case "controls__question":
            createCharacterDiv("question");
            break;
        case "controls__presentation":
            createCharacterDiv("presentation");
            break;
        case "controls__notice":
            createNoticeDiv();
            break;
        default:
            break;
    }
};

socket.on("user-disconnected", (userId) => {
    if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
});

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);

        myPeer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });

        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });

        socket.on("createMessage", (message) => {
            $("ul.messages").append(
                `<li class="message"><b>임의의 도우도우</b><br/>${message}</li>`,
            );
            scrollToBottom();
        });

        socket.on("sendMotion", (type) => {
            if (type === "notice") createNoticeDiv();
            else createCharacterDiv(type);
        });

        const text = $("input");
        $("html").keydown((e) => {
            if (e.which === 13 && text.val().length !== 0) {
                socket.emit("message", text.val());
                text.val("");
            }
        });

        questionBtn.addEventListener("click", (event) => {
            addCharacterMotionController(event);
            socket.emit("motion", "question");
        });
        presentationBtn.addEventListener("click", (event) => {
            addCharacterMotionController(event);
            socket.emit("motion", "presentation");
        });
        noticeBtn.addEventListener("click", (event) => {
            addCharacterMotionController(event);
            socket.emit("motion", "notice");
        });
    });
