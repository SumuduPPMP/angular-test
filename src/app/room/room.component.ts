//import { WebSocketService } from './../web-socket.service';
import { element } from 'protractor';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import * as io from 'socket.io-client';
import * as SimplePeer from 'simple-peer';
import { DataService } from './../data.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css'],
})
export class RoomComponent implements OnInit {
  @ViewChild('mainContainer') mainContainer: ElementRef;
  @ViewChild('mainVideoDiv') mainVideoDiv: ElementRef;
  @ViewChild('otherVideoDiv') otherVideoDiv: ElementRef;
  @ViewChild('footer') footer: ElementRef;

  ownVideo;
  socketRef: any;
  roomID: string;
  host = window.location.hostname;
  //uri: string = 'https://angular-test-video.herokuapp.com';
  //uri: string = 'ws://localhost:3000';
  //Peer = require('simple-peer')

  peersRef: any = [];
  peersArray: any = [];
  videoDivArray: any = [];
  divId = 0;
  userCount: number;
  newUserJoin = false;
  micOn = true;
  videoOn = true;
  TooltipMic: string;
  TooltipVideo: string;
  myStream;

  videoStream: MediaStream;
  test: string;

  constructor(private data: DataService) {
    //this.socketRef = io(this.uri);
    this.socketRef = io();
  }

  ngOnInit(): void {
    console.log(this.roomID);
    // hardcodeed room id for development purpose
    //this.roomID = '6e9473f0-e1e3-11ea-8490-b3d681d4fa88';



    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.myStream = stream;
        this.setRoomIdAndStates();
        // hardcodeed room id for development purpose
        //this.roomID = '6e9473f0-e1e3-11ea-8490-b3d681d4fa88';
        const video = <HTMLVideoElement>document.createElement('video');
        video.muted = true;
        this.addVideoStream(video, this.myStream);
        this.socketRef.emit('join room', this.roomID);

        this.socketRef.on('all users', (users) => {
          const peers = [];
          console.log('users count :' + users.length);
          this.userCount = users.length;
          users.forEach((userID) => {
            console.log('user id=' + userID);
            console.log('my id=' + this.socketRef.id);
            const peer = this.createPeer(
              userID,
              this.socketRef.id,
              this.myStream
            );
            this.peersRef.push({
              peerID: userID,
              peer,
            });
            peers.push(peer);
            this.addVideoStreamForNewUser(peer);
          });
          this.peersArray = peers;
        });

        this.socketRef.on('user joined', (payload) => {
          this.newUserJoin = true;
          console.log('user joined');
          const peer = this.addPeer(
            payload.signal,
            payload.callerID,
            this.myStream
          );
          this.peersRef.push({
            peerID: payload.callerID,
            peer,
          });

          this.peersArray.push(peer);
          const video = <HTMLVideoElement>document.createElement('video');
          this.addVideoStreamForNewUser(peer);
        });

        this.socketRef.on('receiving returned signal', (payload) => {
          const item = this.peersRef.find((p) => p.peerID === payload.id);
          item.peer.signal(payload.signal);
        });
      });
  }

  //functions.....

  createPeer(userToSignal, callerID, stream) {
    var count = 0;
    let peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      if (signal != null) {
        this.socketRef.emit('sending signal', {
          userToSignal,
          callerID,
          signal,
        });
      }
      count++;
    });

    return peer;
  }

  addPeer(incomingSignal, callerID, stream) {
    var count = 0;
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      console.log(signal);
      if (signal != null) {
        this.socketRef.emit('returning signal', { signal, callerID });
      }
      count++;
    });

    peer.signal(incomingSignal);

    return peer;
  }

  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });

    this.createDivForTheVideo(video);
  }
  addVideoStreamForNewUser(peer) {
    peer.on('stream', (stream) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
      this.createDivForTheVideo(video);
    });
  }

  addUsersVideoStream(peersArray) {
    {
      peersArray.map((peer, index) => {
        peer.on('stream', (stream) => {
          console.log(stream);
          const video = document.createElement('video');
          video.srcObject = stream;
          video.addEventListener('loadedmetadata', () => {
            video.play();
          });
          this.createDivForTheVideo(video);
        });
      });
    }
  }
  createDivForTheVideo(video) {
    video.style.transform ='rotateY(180deg)'
    video.style.webkitTransform ='rotateY(180deg)'
    const div = <HTMLDivElement>document.createElement('div');
    div.className = 'embed-responsive embed-responsive-16by9 videoDiv rounded mt-1';
    div.style.backgroundColor = '#202124';
    div.appendChild(video);
    div.id = this.divId.toString();
    div.onclick = function () {
      console.log();
    };
    const button = this.createVideoButton();
    div.appendChild(button);
    div.addEventListener(
      'mouseover',
      function () {
        button.style.opacity = '1';
      },
      false
    );
    div.addEventListener(
      'mouseout',
      function () {
        button.style.opacity = '0';
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
      if(div.title =='main'){
        div.style.backgroundColor = '#202124';
      }
      if(div.title =='other'){
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
      console.log(element.videoDivArray.length);
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
  setRoomIdAndStates() {
    // get the room information
    var audiotrack = this.myStream.getAudioTracks()[0];
    var videotrack = this.myStream.getVideoTracks()[0];
    this.data.currentRoom.subscribe((data) => (this.roomID = data));
    this.data.mic.subscribe((data) => (this.micOn = data));
    this.data.camera.subscribe((data) => (this.videoOn = data));
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
    setTimeout(()=>{
      window.location.reload();
    }, 300);
  }
}
