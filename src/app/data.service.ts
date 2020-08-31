import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class DataService {
  roomId:string=" ";
  videoStream:MediaStream=null;

  private dataSource = new BehaviorSubject<string>(this.roomId);
  currentRoom = this.dataSource.asObservable();

  private videoSource = new BehaviorSubject<MediaStream>(this.videoStream);
  video=this.videoSource.asObservable();

  constructor() { }


  setNewRoomId(data:string){
    this.dataSource.next(data);
    this.roomId = data;
  }

  setVideoStream(data:MediaStream){

    this.videoSource.next(data);
    this.videoStream = data;
    console.log( this.videoStream)
  }
  getVideoStream(){
    return this.videoStream;
  }
}
