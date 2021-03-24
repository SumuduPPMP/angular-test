import { DataService } from './../data.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { v1 as uuid } from 'uuid';

@Component({
  selector: 'createroom',
  templateUrl: './createroom.component.html',
  styleUrls: ['./createroom.component.css'],
})
export class CreateroomComponent implements OnInit {
  @ViewChild('ownVideo') video: ElementRef;
  @ViewChild('ownVideoDiv') videoDiv: ElementRef;
  @ViewChild('content') private content;
  roomID: string;
  micOn = true;
  videoOn = true;
  TooltipMic = 'Turn off mic';
  TooltipVideo = 'Turn off camera';
  myStream;
  constructor(private data: DataService,private modalService: NgbModal) {}

  ngOnInit(): void {
    //this.roomID = uuid();
    // check media device permission state
    navigator.permissions.query({ name: 'camera' }).then((res) => {
      if (res.state == 'granted') {
        console.log('has permission');
      } else {
        console.log('No permission');
        this.openModel(this.content)
      }
    });
    ///////////////////////////////////////
  }
  sendRoomId(room_id) {
    this.roomID = room_id;
    this.data.setNewRoomId(this.roomID);
    this.data.setMicState(this.micOn);
    this.data.setCameraState(this.videoOn);
  }
  ngAfterViewInit() {
    const myVideo = this.video.nativeElement;
    myVideo.muted = true;
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        this.myStream = stream;
        this.addmyVideoStream(myVideo, stream);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  addmyVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    this.videoDiv.nativeElement.append(video);
  }
  micOnOff() {
    // !this.micOn ? this.TooltipMic="Turn off mic": this.TooltipMic="Turn on mic"
    console.log(this.myStream);
    if(this.myStream){
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

  }
  videoOnOff() {
    // !this.videoOn ? this.TooltipVideo="Turn off camera": this.TooltipVideo="Turn on camera"
    if(this.myStream){
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

  }
  openModel(content) {
    this.modalService.open(content, { centered: true,size: 'lg',backdropClass: 'dark-bg-model ' });
  }
}
