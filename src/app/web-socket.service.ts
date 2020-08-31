import { Injectable } from '@angular/core';
import * as io from "socket.io-client";
import { Observable, Subscriber } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  socket:any;
  uri:string ="ws://localhost:3000"
  constructor() {
    this.socket = io(this.uri);
  }

  listen(eventName: String){
    return new Observable((subscriber) =>{

      this.socket.on(eventName,(data) =>{
        subscriber.next(data);
      })
    })
  }
  // emit(eventName: string, data1: any, data2:any) {
  //   this.socket.emit(eventName,data1,data2)
  // }
  emit(eventName: string, data1: any){
    this.socket.emit(eventName,data1)
  }
}
