import { Component, OnInit,OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as io from 'socket.io-client';
import * as SimplePeer from 'simple-peer';
import { DataService } from './../data.service';
import { Subscription } from 'rxjs';
import {NgbPopover} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css'],
})
export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild('mainContainer') mainContainer: ElementRef;
  @ViewChild('mainVideoDiv') mainVideoDiv: ElementRef;
  @ViewChild('otherVideoDiv') otherVideoDiv: ElementRef;
  @ViewChild('footer') footer: ElementRef;

  ownVideo;
  socketRef: any;
  roomID: string;
  host = window.location.hostname;
  // testing uri for localhost
  uri: string = 'ws://localhost:3000';

  peersRef: any = [];
  peersArray: any = [];
  videoDivArray: any = [];
  usersArray: any = [];
  divId = 0;
  userCount: number;
  newUserJoin = false;
  micOn = true;
  videoOn = true;
  openFullScreen = true;
  ischatOpen = false;
  cameraAvailable: boolean;
  screenShareActive: boolean;
  shareScreenId: string;
  TooltipMic: string;
  TooltipVideo: string;
  TooltipFscreen: string;
  currentTime;
  myStream: MediaStream;
  mediaQuery;
  mediaStreamIdWithoutCamera: string;
  cameralessStreamId ="abcd";
  newMessage: string;
  alartText:string;
  alartType:number;
  newMessageAvailable: boolean;
  showMessage$: Subscription;

  constructor(private data: DataService) {
     // testing uri for localhost
  this.socketRef = io(this.uri);
    //this.socketRef = io();

    this.showMessage$ = this.data.getMessage.subscribe((msg) => {
      this.newMessage = msg;
      if(this.newMessage!=" " && !this.ischatOpen){
       this.newMessageAvailable= true;
        this.showNewMessage();
      }
    });
  }
  ngOnInit(): void {
    this.mediaQuery = window.matchMedia('(max-width: 767.98px)');
    console.log(this.roomID);
    // hardcodeed room id for development purpose
    //this.roomID = '6e9473f0-e1e3-11ea-8490-b3d681d4fa88';
    this.commonAlart(1)

    this.socketRef.on('user disconnect', (user_id) => {
      this.removeUserDiv(user_id);
      this.commonAlart(2)
    });
    this.socketRef.on('anyway disconnect', (user_id) => {
      this.removeUserDiv(user_id);
    });
    this.socketRef.on('sharescreen active', (user_id) => {
      this.screenShareActive = true;
      this.shareScreenId = user_id;
      this.mirrorAndFullScreenVideo(this.shareScreenId);
    });
    this.socketRef.on('sharescreen ended', (user_id) => {
      this.screenShareActive = false;
      this.mirrorAndFullScreenVideo(user_id);
    });
    this.socketRef.on('videoless stream', (stream_id) => {
      this.mediaStreamIdWithoutCamera = stream_id
    });
    this.socketRef.on('time', (time) => {
      this.getCurrentTime();
    });

    navigator.mediaDevices.enumerateDevices().then(devices => {
      var cams = devices.filter(device => device.kind == "videoinput");
      var mics = devices.filter(device => device.kind == "audioinput");
      if(cams.length>0){
        navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("camera");
        this.cameraAvailable = true;
        this.myStream = stream;
        this.coreFunction(stream);
      })
      .catch((err) => {
        console.log(err);
      });

      } else{
        console.log(" No camera");
        navigator.mediaDevices
          .getUserMedia({ video: false, audio: true })
          .then((stream) => {
            this.cameraAvailable = false;
            this.myStream = stream;
            this.socketRef.emit('without camera', stream.id)
            this.coreFunction(stream);
          })
          .catch((err) => {
            console.log(err);
          });

      }
    })
  }

  ngOnDestroy(): void {
    this.showMessage$.unsubscribe();
  }

  //functions.....
  coreFunction(stream) {
    try {
      this.setRoomIdAndStates(this.cameraAvailable);
      const video = <HTMLVideoElement>document.createElement('video');
      video.muted = true;
      video.style.pointerEvents = 'none';
      // video.style.width='100%';
      // video.style.height='auto';
      this.userCount = 1;
      this.addVideoStream(video, stream);
      console.log(this.roomID)
      this.socketRef.emit('join room', this.roomID);
      this.socketRef.on('all users', (users) => {
        this.usersArray = users;
        const peers = [];
        this.userCount = this.userCount + users.length;
        users.forEach((userID) => {
          const peer = this.createPeer(
            userID,
            this.socketRef.id,
            stream
          );
          this.peersRef.push({
            peerID: userID,
            peer,
          });
          peers.push(peer);
          this.addVideoStreamForNewUser(peer, userID);
          console.log("room users");
        });
        this.peersArray = peers;
      });

      this.socketRef.on('user joined', (payload) => {
        //if(this.cameralessStreamId != payload.callerID){
          this.newUserJoin = true;
        this.userCount++;
        const peer = this.addPeer(
          payload.signal,
          payload.callerID,
          stream
        );
        this.peersRef.push({
          peerID: payload.callerID,
          peer,
        });
        this.peersArray.push(peer);
        console.log('user joind');
        this.addVideoStreamForNewUser(peer, payload.callerID);

       // this.cameralessStreamId = payload.callerID
       // }
        this.commonAlart(3)
      });

      this.socketRef.on('receiving returned signal', (payload) => {
        const item = this.peersRef.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });
    } catch (err) {
      console.log(err);
    }
  }

  createPeer(userToSignal, callerID, stream) {
    let peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });
    peer.on('signal', (signal) => {
       try{
         console.log("sending signal:" + userToSignal);
       this.socketRef.emit('sending signal', {
         userToSignal,
         callerID,
         signal,
       });
      }catch(err){
        console.log(err);
      }
    });

    return peer;
  }

  addPeer(incomingSignal, callerID, stream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });
    peer.on('signal', (signal) => {
      this.socketRef.emit('returning signal', { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    if (!this.myStream.getVideoTracks()[0]) {
      const div = <HTMLDivElement>document.createElement('div');
      div.className = 'd-flex justify-content-center';
      div.style.height = '100%';
      div.style.width = '100%';
      const icon = document.createElement('i');
      icon.className = ' fas fa-user-alt text-muted';
      icon.style.fontSize = '350%';
      div.appendChild(icon);
      this.createDivForTheVideo(div);
    } else {
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
      this.createDivForTheVideo(video);
    }
  }
  addVideoStreamForNewUser(peer, userID) {
    peer.on('stream', (stream) => {

    if(this.cameralessStreamId != stream.id){
      if (this.mediaStreamIdWithoutCamera == stream.id) {
        this.createDivforNoCamera(userID, stream);
        //this.userCount--
        console.log("divs for no camera");
      } else {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.style.pointerEvents = 'none';
        video.id = userID;
        video.addEventListener('loadedmetadata', () => {
          video.play();
        });
        this.createDivForTheVideo(video);
      }
      this.cameralessStreamId = stream.id
    }




    });
  }
  createDivforNoCamera(userID, stream) {
    const div = <HTMLDivElement>document.createElement('div');
    div.className = 'd-flex justify-content-center';
    div.style.height = '100%';
    div.style.width = '100%';
    const icon = document.createElement('i');
    icon.className = ' fas fa-user-alt text-muted';
    icon.style.fontSize = '350%';

    const video = document.createElement('video');
    video.srcObject = stream;
    video.style.pointerEvents = 'none';
    video.id = userID;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    div.appendChild(video);
    div.appendChild(icon);
    div.id = userID;
    this.createDivForTheVideo(div);
  }

  createDivForTheVideo(video) {
    video.style.transform = 'rotateY(180deg)';
    video.style.webkitTransform = 'rotateY(180deg)';
    const div = <HTMLDivElement>document.createElement('div');
    div.className =
      'd-flex align-items-center embed-responsive embed-responsive-16by9 videoDiv rounded mt-1';
    div.style.backgroundColor = '#202124';
    if (this.mediaQuery.matches) {
      div.style.height = '100%';
    }
    div.appendChild(video);
    div.id = this.divId.toString();
    div.onclick = function () {};
    const button = this.createVideoButton();
    div.appendChild(button);
    div.addEventListener(
      'mouseover',
      function () {
        button.style.opacity = '1';
        div.style.boxShadow = ' 1px 0px 8px 1px #47484a';
      },
      false
    );
    div.addEventListener(
      'mouseout',
      function () {
        button.style.opacity = '0';
        div.style.boxShadow = ' 0px 0px 0px 0px #47484a';
      },
      false
    );
    this.videoDivArray.push(div);
    this.videoDivArray.forEach((div) => {
      if (!this.mainVideoDiv.nativeElement.firstElementChild && div.id == 0) {
        this.mainVideoDiv.nativeElement.append(div);
        div.title = 'main';
      } else if (div.id == 1) {
        const oldMain = this.mainVideoDiv.nativeElement.firstElementChild;
        oldMain.title = 'other';
        oldMain.style.backgroundColor = '#3a3b3d';
        this.mainVideoDiv.nativeElement.firstElementChild.remove();
        this.otherVideoDiv.nativeElement.append(oldMain);

        this.mainVideoDiv.nativeElement.append(div);
        div.title = 'main';
      } else if (div.id > 1) {
        this.otherVideoDiv.nativeElement.append(div);
        div.title = 'other';
        div.style.backgroundColor = '#3a3b3d';
      }
      if (div.title == 'main') {
        div.style.backgroundColor = '#202124';
      }
      if (div.title == 'other') {
      }
    });
    this.divId++;
  }
  createVideoButton() {
    const element = this;
    const btdiv = document.createElement('div');
    btdiv.className = 'p-1';
    btdiv.style.position = 'absolute';
    btdiv.style.zIndex = '1';
    btdiv.style.bottom = '0';
    btdiv.style.left = '0';
    btdiv.style.width = '100%';
    btdiv.style.opacity = '0';
    const button = document.createElement('button');
    button.className =
      'btn btn-light btn-sm d-flex justify-content-center align-items-center p-2';
    button.style.width = '25px';
    button.style.height = '25px';
    button.style.borderRadius = '12.5px';
    button.onclick = function () {
      if (
        btdiv.parentElement.title == 'other' &&
        element.videoDivArray.length > 1
      ) {
        if (element.mainVideoDiv.nativeElement.firstElementChild) {
          const oldMain = element.mainVideoDiv.nativeElement.firstElementChild;
          oldMain.title = 'other';
          element.mainVideoDiv.nativeElement.firstElementChild.remove();
          element.otherVideoDiv.nativeElement.append(oldMain);
          oldMain.style.backgroundColor = '#3a3b3d';
        }
        element.mainVideoDiv.nativeElement.append(btdiv.parentElement);
        btdiv.parentElement.title = 'main';
        btdiv.parentElement.style.backgroundColor = '#202124';
      }
    };
    const i = document.createElement('i');
    i.className = 'fas fa-thumbtack';
    i.style.fontSize = '10px';
    button.append(i);
    btdiv.append(button);
    return btdiv;
  }
  fadeIn(div) {
    var fadeEffect = setInterval(function () {
      if (!div.style.opacity) {
        div.style.opacity = 0;
      }
      if (div.style.opacity < 1) {
        div.style.opacity += 0.1;
      } else {
        clearInterval(fadeEffect);
      }
    }, 50);
  }
  fadeOut(div) {
    var fadeEffect = setInterval(function () {
      if (!div.style.opacity) {
        div.style.opacity = 1;
      }
      if (div.style.opacity > 0) {
        div.style.opacity = 0.1;
      } else {
        clearInterval(fadeEffect);
      }
    }, 50);
  }
  removeUserDiv(userID) {
    this.videoDivArray.forEach((div) => {
      var removeVideo = div.firstElementChild;
      if (removeVideo.id == userID) {
        this.userCount--;
        div.remove();
        const index = this.videoDivArray.indexOf(div);
        if (index > -1) {
          this.videoDivArray.splice(index, 1);
        }
        if (!this.mainVideoDiv.nativeElement.firstElementChild) {
          const oldother = this.otherVideoDiv.nativeElement.firstElementChild;
          oldother.title = 'main';
          this.otherVideoDiv.nativeElement.firstElementChild.remove();
          this.mainVideoDiv.nativeElement.append(oldother);
          oldother.style.backgroundColor = '#202124';
        }
      }
    });
  }
  setRoomIdAndStates(isCamera) {
    // get room information
    this.data.currentRoom.subscribe((data) => (this.roomID = data));
    this.data.mic.subscribe((data) => (this.micOn = data));
    this.data.camera.subscribe((data) => (this.videoOn = data));
    this.TooltipFscreen = 'Full screen';
    if (isCamera) {
      var audiotrack = this.myStream.getAudioTracks()[0];
      var videotrack = this.myStream.getVideoTracks()[0];

      if (this.micOn) {
        this.TooltipMic = 'Turn off mic';
        audiotrack.enabled = true;
      } else {
        this.TooltipMic = 'Turn on mic';
        audiotrack.enabled = false;
      }
      if (this.videoOn) {
        this.TooltipVideo = 'Turn off camera';
        videotrack.enabled = true;
      } else {
        this.TooltipVideo = 'Turn on camera';
        videotrack.enabled = false;
      }
    }
  }
  getCurrentTime() {
    var date = new Date();
    var hr = date.getHours();
    var min = date.getMinutes();
    var minu;
    var minutes;
    if (min < 10) {
      minutes = '0' + min.toString();
      minu = minutes;
    } else {
      minu = min;
    }
    var ampm = 'AM';
    if (hr > 12) {
      hr -= 12;
      ampm = 'PM';
    }
    var time = (hr + ':' + minu + ' ' + ampm).toString();
    this.currentTime = time;
  }
  commonAlart(alartType){
    this.alartType = alartType
    if(alartType == 1){
      this.alartText = "Welcome To PPMP Meet"
      //document.getElementById("commonAlart").classList.add("btn-info")
      //document.querySelector("#commonAlart").classList.add("btn-info-alart")
    }
    if(alartType == 2){
      this.alartText = "A User Disconnected"
      //document.getElementById("commonAlart").classList.add("btn-danger")
      //document.querySelector("#commonAlart").classList.add("btn-danger-alart")
    }
    if(alartType ==3){
      this.alartText = "A User Joined"
      //document.getElementById("commonAlart").classList.add("btn-info")
      //document.querySelector("#commonAlart").classList.add("btn-info-alart")
    }
    document.querySelector("#commonAlart").classList.toggle("commonAlartOpen");
    setTimeout(function() {
      document.querySelector("#commonAlart").classList.toggle("commonAlartOpen");
    }, 5000);
}
  chatOpenClose(){
      this.newMessageAvailable= false;
      document.querySelector("#chatSidebar").classList.toggle("sidebarOpen");
      document.querySelector("#main").classList.toggle("addMargginForMain");
      document.querySelector("#othervideo").classList.toggle("othervideoanimation");
      this.ischatOpen = !this.ischatOpen
      if (!this.mediaQuery.matches) {
        document.querySelector("#timecard").classList.toggle("timecardanimation");
      }
  }
  showNewMessage(){
    document.querySelector("#newMsgAlart").classList.toggle("newMewssageOpen");
    this.chatSound()
    setTimeout(function() {
      document.querySelector("#newMsgAlart").classList.toggle("newMewssageOpen");
    }, 5000);
  }
  chatSound(){
    let audio = new Audio()
    audio.src="assets/alert1.mp3"
    audio.load()
    audio.play()
  }
  micOnOff() {
    var track = this.myStream.getAudioTracks()[0];
    if (!this.micOn) {
      this.TooltipMic = 'Turn off mic';
      track.enabled = true;
    } else {
      this.TooltipMic = 'Turn on mic';
      track.enabled = false;
    }
    this.micOn = !this.micOn;
  }
  videoOnOff() {
    var track = this.myStream.getVideoTracks()[0];
    if (!this.videoOn) {
      this.TooltipVideo = 'Turn off camera';
      track.enabled = true;
    } else {
      this.TooltipVideo = 'Turn on camera';
      track.enabled = false;
    }
    this.videoOn = !this.videoOn;
  }
  endCall() {
    this.socketRef.emit('user disconnect', this.socketRef.id);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }
  openFullscreen() {
    var elem = document.documentElement;
    if (this.openFullScreen) {
      this.TooltipFscreen = 'Exit full screen';
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      this.TooltipFscreen = 'Full screen';
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    this.openFullScreen = !this.openFullScreen;
  }
  videoFullscreen() {
    this.videoDivArray.forEach((div) => {
      var video = div.firstElementChild;
      if (video.id == this.shareScreenId) {
        if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      }
    });
  }
  pictureInPicture() {
    this.videoDivArray.forEach((div) => {
      var video = div.firstElementChild;
      if (video.id == this.shareScreenId) {
        if (!video.pictureInPictureElement) {
          video.requestPictureInPicture().catch((error) => {
            // Video failed to enter Picture-in-Picture mode.
          });
        } else {
          video.exitPictureInPicture().catch((error) => {
            // Video failed to leave Picture-in-Picture mode.
          });
        }
      }
    });
  }
  async shareScreen() {
    const mediaDevices = navigator.mediaDevices as any;
    await mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        this.socketRef.emit('sharescreen active', this.socketRef.id);

        this.peersArray.forEach((peer) => {
          peer.replaceTrack(
            this.myStream.getVideoTracks()[0],
            stream.getVideoTracks()[0],
            this.myStream
          );
          stream.getVideoTracks()[0].onended = () => {
            this.socketRef.emit('sharescreen ended', this.socketRef.id);

            this.peersArray.forEach((peer) => {
              peer.replaceTrack(
                stream.getVideoTracks()[0],
                this.myStream.getVideoTracks()[0],
                this.myStream
              );
            });
          };
        });
      });
  }
  mirrorAndFullScreenVideo(peerID) {
    this.videoDivArray.forEach((div) => {
      var mirrorVideo = div.firstElementChild;
      if (mirrorVideo.id == peerID) {
        if (this.screenShareActive) {
          mirrorVideo.style.transform = 'rotateY(0deg)';
          mirrorVideo.style.webkitTransform = 'rotateY(0deg)';
          if (
            div.title == 'other' &&
            this.mainVideoDiv.nativeElement.firstElementChild
          ) {
            const oldMain = this.mainVideoDiv.nativeElement.firstElementChild;
            oldMain.title = 'other';
            this.mainVideoDiv.nativeElement.firstElementChild.remove();
            this.otherVideoDiv.nativeElement.append(oldMain);
            oldMain.style.backgroundColor = '#3a3b3d';

            const oldOther = div;
            oldOther.title = 'main';
            div.remove();
            this.mainVideoDiv.nativeElement.append(oldOther);
            oldOther.style.backgroundColor = '#202124';

            if (mirrorVideo.requestFullscreen) {
              mirrorVideo.requestFullscreen();
            }
          }
        } else {
          mirrorVideo.style.transform = 'rotateY(180deg)';
          mirrorVideo.style.webkitTransform = 'rotateY(180deg)';
        }
      }
    });
  }
}
