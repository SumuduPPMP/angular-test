import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class DataService {
  roomId:string=" ";
  videoStream:MediaStream=null;
  micOn=true;
  cameraOn=true;

  private dataSource = new BehaviorSubject<string>(this.roomId);
  currentRoom = this.dataSource.asObservable();

  private micState = new BehaviorSubject<boolean>(this.micOn);
  mic=this.micState.asObservable();

  private cameraState = new BehaviorSubject<boolean>(this.cameraOn);
  camera=this.cameraState.asObservable();

  constructor() { }


  setNewRoomId(data:string){
    this.dataSource.next(data);
    this.roomId = data;
  }
  setMicState(data:boolean){
    this.micState.next(data)
    this.micOn=data
  }
  setCameraState(data:boolean){
    this.cameraState.next(data)
    this.cameraOn=data
  }
}
