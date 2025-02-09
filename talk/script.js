var conf = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
var pc = new RTCPeerConnection(conf);
var localStream,
  _fileChannel,
  chatEnabled,
  context,
  source,
  _chatChannel,
  sendFileDom = {},
  recFileDom = {},
  receiveBuffer = [],
  receivedSize = 0,
  file,
  bytesPrev = 0;

function errHandler(err) {
  console.log(err);
}

function enableChat() {
  enable_chat.checked ? (chatEnabled = true) : (chatEnabled = false);
}
enableChat();

// Initialize media handling
function initializeMedia() {
  if (localStream) {
    // If we already have a stream, stop all tracks
    localStream.getTracks().forEach((track) => track.stop());
  }

  if (enable_media.checked) {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        localStream = stream;
        micused.innerHTML = localStream.getAudioTracks()[0].label;
        pc.addStream(stream);
        local.srcObject = stream;
        local.muted = true;
      })
      .catch(errHandler);
  } else {
    // Clear the streams if media is disabled
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      local.srcObject = null;
      remote.srcObject = null;
      micused.innerHTML = "";
    }
  }
}

// Add event listener for media toggle
enable_media.addEventListener("change", initializeMedia);

function sendMsg() {
  var text = sendTxt.value;
  chat.innerHTML = chat.innerHTML + "<pre class=sent>" + text + "</pre>";
  _chatChannel.send(text);
  sendTxt.value = "";
  return false;
}

pc.ondatachannel = function (e) {
  if (e.channel.label == "fileChannel") {
    console.log("fileChannel Received -", e);
    _fileChannel = e.channel;
    fileChannel(e.channel);
  }
  if (e.channel.label == "chatChannel") {
    console.log("chatChannel Received -", e);
    _chatChannel = e.channel;
    chatChannel(e.channel);
  }
};

pc.onicecandidate = function (e) {
  var cand = e.candidate;
  if (!cand) {
    console.log("iceGatheringState complete\n", pc.localDescription.sdp);
    localOffer.value = JSON.stringify(pc.localDescription);
  } else {
    console.log(cand.candidate);
  }
};

pc.oniceconnectionstatechange = function () {
  console.log("iceconnectionstatechange: ", pc.iceConnectionState);
};

pc.ontrack = function (e) {
  console.log("remote ontrack", e.streams);
  remote.srcObject = e.streams[0];
};

pc.onconnection = function (e) {
  console.log("onconnection ", e);
};

remoteOfferGot.onclick = function () {
  var _remoteOffer = new RTCSessionDescription(JSON.parse(remoteOffer.value));
  console.log("remoteOffer \n", _remoteOffer);
  pc.setRemoteDescription(_remoteOffer)
    .then(function () {
      console.log("setRemoteDescription ok");
      if (_remoteOffer.type == "offer") {
        pc.createAnswer()
          .then(function (description) {
            console.log("createAnswer 200 ok \n", description);
            pc.setLocalDescription(description)
              .then(function () {})
              .catch(errHandler);
          })
          .catch(errHandler);
      }
    })
    .catch(errHandler);
};

localOfferSet.onclick = function () {
  if (chatEnabled) {
    _chatChannel = pc.createDataChannel("chatChannel");
    _fileChannel = pc.createDataChannel("fileChannel");
    chatChannel(_chatChannel);
    fileChannel(_fileChannel);
  }
  pc.createOffer()
    .then((des) => {
      console.log("createOffer ok ");
      pc.setLocalDescription(des)
        .then(() => {
          setTimeout(function () {
            if (pc.iceGatheringState == "complete") {
              return;
            } else {
              console.log("after GetherTimeout");
              localOffer.value = JSON.stringify(pc.localDescription);
            }
          }, 2000);
          console.log("setLocalDescription ok");
        })
        .catch(errHandler);
    })
    .catch(errHandler);
};

//File transfer
fileTransfer.onchange = function (e) {
  var files = fileTransfer.files;
  if (files.length > 0) {
    file = files[0];
    sendFileDom.name = file.name;
    sendFileDom.size = file.size;
    sendFileDom.type = file.type;
    sendFileDom.fileInfo = "areYouReady";
    console.log(sendFileDom);
  } else {
    console.log("No file selected");
  }
};

function sendFile() {
  if (!fileTransfer.value) return;
  var fileInfo = JSON.stringify(sendFileDom);
  _fileChannel.send(fileInfo);
  console.log("file info sent");
}

function fileChannel(e) {
  _fileChannel.onopen = function (e) {
    console.log("file channel is open", e);
  };
  _fileChannel.onmessage = function (e) {
    // Figure out data type
    var type = Object.prototype.toString.call(e.data),
      data;
    if (type == "[object ArrayBuffer]") {
      data = e.data;
      receiveBuffer.push(data);
      receivedSize += data.byteLength;
      recFileProg.value = receivedSize;
      if (receivedSize == recFileDom.size) {
        var received = new window.Blob(receiveBuffer);
        file_download.href = URL.createObjectURL(received);
        file_download.innerHTML = "download";
        file_download.download = recFileDom.name;
        receiveBuffer = [];
        receivedSize = 0;
      }
    } else if (type == "[object String]") {
      data = JSON.parse(e.data);
    } else if (type == "[object Blob]") {
      data = e.data;
      file_download.href = URL.createObjectURL(data);
      file_download.innerHTML = "download";
      file_download.download = recFileDom.name;
    }

    // Handle initial msg exchange
    if (data.fileInfo) {
      if (data.fileInfo == "areYouReady") {
        recFileDom = data;
        recFileProg.max = data.size;
        var sendData = JSON.stringify({ fileInfo: "readyToReceive" });
        _fileChannel.send(sendData);
      } else if (data.fileInfo == "readyToReceive") {
        sendFileProg.max = sendFileDom.size;
        sendFileinChannel(); // Start sending the file
      }
      console.log("_fileChannel: ", data.fileInfo);
    }
  };
  _fileChannel.onclose = function () {
    console.log("file channel closed");
  };
}

function sendMsg() {
    var text = sendTxt.value;
    var username = document.getElementById('username').value || 'You';
    
    if (text.trim() === '') return false;
    
    appendMessage(text, username, true);
    _chatChannel.send(JSON.stringify({
        message: text,
        username: username
    }));
    sendTxt.value = "";
    return false;
}

function appendMessage(text, username, isSent) {
    var messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper ' + (isSent ? 'sent' : 'received');

    var usernameDiv = document.createElement('div');
    usernameDiv.className = 'username';
    usernameDiv.textContent = username;

    var messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isSent ? 'sent' : 'received');
    messageDiv.textContent = text;

    messageWrapper.appendChild(usernameDiv);
    messageWrapper.appendChild(messageDiv);
    
    chat.appendChild(messageWrapper);
    chat.scrollTop = chat.scrollHeight;
}

function chatChannel(e) {
    _chatChannel.onopen = function(e) {
        console.log('chat channel is open', e);
    }
    _chatChannel.onmessage = function(e) {
        try {
            const data = JSON.parse(e.data);
            appendMessage(data.message, data.username, false);
        } catch (err) {
            // Fallback for plain text messages
            appendMessage(e.data, 'Remote User', false);
        }
    }
    _chatChannel.onclose = function() {
        console.log('chat channel closed');
    }
}

function sendFileinChannel() {
  var chunkSize = 16384;
  var sliceFile = function (offset) {
    var reader = new window.FileReader();
    reader.onload = (function () {
      return function (e) {
        _fileChannel.send(e.target.result);
        if (file.size > offset + e.target.result.byteLength) {
          window.setTimeout(sliceFile, 0, offset + chunkSize);
        }
        sendFileProg.value = offset + e.target.result.byteLength;
      };
    })(file);
    var slice = file.slice(offset, offset + chunkSize);
    reader.readAsArrayBuffer(slice);
  };
  sliceFile(0);
}

// Audio file streaming
streamAudioFile.onchange = function () {
  if (!enable_media.checked) {
    alert("Please enable video/audio first");
    return;
  }
  console.log("streamAudioFile");
  context = new AudioContext();
  var file = streamAudioFile.files[0];
  if (file) {
    if (file.type.match("audio*")) {
      var reader = new FileReader();
      reader.onload = function (readEvent) {
        context.decodeAudioData(readEvent.target.result, function (buffer) {
          source = context.createBufferSource();
          source.buffer = buffer;
          source.start(0);
          source.connect(context.destination);
          var remote = context.createMediaStreamDestination();
          source.connect(remote);
          local.srcObject = remote.stream;
          local.muted = true;
          pc.addStream(remote.stream);
        });
      };
      reader.readAsArrayBuffer(file);
    }
  }
};

/* Summary
    //setup your video
    pc = new RTCPeerConnection
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    pc.addStream(stream)

    //prepare your sdp1
    pc.createOffer() - des
    pc.setLocalDescription(des)
    pc.onicecandidate
    pc.localDescription
    
    //create sdp from sdp1
    _remoteOffer = new RTCSessionDescription sdp
    pc.setRemoteDescription(_remoteOffer)
    _remoteOffer.type == "offer" && pc.createAnswer() - desc
    pc.setLocalDescription(description)
    pc.onaddstream
*/
