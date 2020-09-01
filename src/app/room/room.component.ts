import { WebSocketService } from './../web-socket.service';
import { element } from 'protractor';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import * as io from 'socket.io-client';
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
  uri:string ='http://localhost:3000'
  Peer = require('simple-peer')

  peersRef: any = [];
  peersArray: any = [];
  videoDivArray: any = [];
  divId=0;
  userCount: number;
  newUserJoin = false;
  micOn=true;
  videoOn=true;
  TooltipMic ="Mic Off"
  TooltipVideo = "Video Off"


  videoStream: MediaStream;
  test:string;

  constructor(private data: DataService, private WebSocketService:WebSocketService) {
    this.socketRef = io('http://localhost', {path: '/nodejs/socket.io'});
  }

  ngOnInit(): void {

    this.WebSocketService.listen("test").subscribe((data) =>{
      console.log(data)
    })

    // get the room id
    this.data.currentRoom.subscribe((data) => (this.roomID = data));
    // hardcodeed room id for development purpose
    this.roomID = '6e9473f0-e1e3-11ea-8490-b3d681d4fa88';
    this.socketRef.on('room full',yy=>{
console.log("room is fulll")
    })

    this.socketRef.on('user-disconnected',userId =>{
      console.log("user disconencted" + userId)
    })

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {

        const video = <HTMLVideoElement>(document.createElement('video'));
        video.muted = true;
        this.addVideoStream(video, stream);
        this.socketRef.emit('join room', this.roomID);

        this.socketRef.on('all users', (users) => {
          const peers = [];
          console.log('users count :' + users.length);
          this.userCount=users.length;
          users.forEach((userID) => {
            const peer = this.createPeer(userID, this.socketRef.id, stream);
            this.peersRef.push({
              peerID: userID,
              peer,
            });
            peers.push(peer);
            console.log('peers created :' + peers.length);
          });
          this.peersArray = peers;
          console.log("array="+this.peersArray)
          this.addUsersVideoStream(this.peersArray, stream);
        });

        this.socketRef.on('user joined', (payload) => {
          this.newUserJoin=true;
          console.log('user joined');
          const peer = this.addPeer(payload.signal, payload.callerID, stream);
          this.peersRef.push({
            peerID: payload.callerID,
            peer,
          });

          this.peersArray.push(peer);
          const video = <HTMLVideoElement>(document.createElement('video'));
          this.addVideoStreamForNewUser(video, stream);
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
    let peer = new this.Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    console.log('created a peer');
    peer.on('signal', (signal) => {
      if (count == 0) {
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
    const peer = new this.Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      if (count == 0) {
        this.socketRef.emit('returning signal', { signal, callerID });
      }
      count++;
    });

    peer.signal(incomingSignal);

    return peer;
  }

  //
  addVideoStream(video: HTMLVideoElement, stream:MediaStream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });

    this.createDivForTheVideo(video);
  }
  addVideoStreamForNewUser(video: HTMLVideoElement, stream:MediaStream) {

    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    this.createDivForTheVideo(video);
  }

  addUsersVideoStream(peersArray, stream) {
    peersArray.forEach((peer) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
      this.createDivForTheVideo(video);
    });
  }
  createDivForTheVideo(video){
    const div = <HTMLDivElement>(document.createElement('div'));
    div.className="embed-responsive embed-responsive-16by9 videoDiv rounded mt-1"
    div.style.backgroundColor="#202124"
    div.appendChild(video);
    div.id=this.divId.toString();
    div.onclick = function(){console.log()}
    const button =this.createVideoButton();
    div.appendChild(button);
    div.addEventListener("mouseover", function() {
      button.style.opacity ="1"
    }, false);
    div.addEventListener("mouseout", function() {
      button.style.opacity ="0"
    }, false);
    this.videoDivArray.push(div);
    this.videoDivArray.forEach(div => {
      if(div.id==1){
        this.mainVideoDiv.nativeElement.append(div);
        div.title="main"
      }
      else{
        this.otherVideoDiv.nativeElement.append(div);
        div.title="other"
      }
    });
    this.divId++;
  }
  createVideoButton(){
    const element = this;
    const btdiv = document.createElement('div');
    btdiv.className="p-1"
    btdiv.style.position="absolute"
    btdiv.style.zIndex="1"
    btdiv.style.bottom="0"
    btdiv.style.left="0"
    btdiv.style.width="100%"
    btdiv.style.opacity ="0"
    const button = document.createElement('button');
    button.className="btn btn-outline-light btn-sm";
    button.onclick = function(){
      console.log(element.videoDivArray.length)
      if(btdiv.parentElement.title=="other" && element.videoDivArray.length > 1){
        if( element.mainVideoDiv.nativeElement.firstElementChild){
          const oldMain=element.mainVideoDiv.nativeElement.firstElementChild;
          oldMain.title="other";
          element.mainVideoDiv.nativeElement.firstElementChild.remove();
          element.otherVideoDiv.nativeElement.append(oldMain);
        }
        element.mainVideoDiv.nativeElement.append(btdiv.parentElement);
        btdiv.parentElement.title="main"
      }

    }
    const i = document.createElement("i");
    i.className="fas fa-thumbtack"
    button.append(i);
    btdiv.append(button);
    return btdiv
  }
  micOnOff(){
    !this.micOn ? this.TooltipMic="Mic Off": this.TooltipMic="Mic On"
    this.micOn=!this.micOn;
  }
  videoOnOff(){
    !this.videoOn ? this.TooltipVideo="Video Off": this.TooltipVideo="Video On"
    this.videoOn =! this.videoOn
  }
  endCall(){
  }

}
