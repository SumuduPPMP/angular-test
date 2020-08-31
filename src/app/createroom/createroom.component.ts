import { DataService } from './../data.service';
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
  roomID: string;
  constructor(private data: DataService) {}
  ngOnInit(): void {
    //this.roomID = uuid();
  }
  sendRoomId(room_id) {
    this.roomID=room_id;
    this.data.setNewRoomId(this.roomID);
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
        this.addmyVideoStream(myVideo, stream);
      });
  }
  addmyVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    this.videoDiv.nativeElement.append(video);
  }
}
