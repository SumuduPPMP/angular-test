import { Component,OnInit, AfterViewInit,Input,ViewChild,ViewChildren, ElementRef,QueryList } from '@angular/core';
import { Message } from './messages';
import { DataService } from './../data.service';

@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewInit {
  textmessage: string;
  @Input() socketRef: any;
  @Input() roomID: any;

  @ViewChild('scrollframe',) scrollFrame: ElementRef;
  @ViewChildren('item') itemElements: QueryList<any>;
  textChatArray:  any = [];
  private scrollContainer: any;

  constructor(private data: DataService) { }

  ngAfterViewInit(): void {

    this.scrollContainer = this.scrollFrame.nativeElement;
    this.itemElements.changes.subscribe(_ => this.onItemElementsChanged());

    this.socketRef.on('receive message', (msg:string) => {
      let message = new Message();
      message.type = "received";
      message.message = msg;
      message.name = "User";
      message.time = this.getCurrentTime();
      message.date = new Date();
      this.textChatArray.push(message)
      this.data.announceMessage(msg)
    });
  }
  sendMessage(){
    let message = new Message();
    this.socketRef.emit('send message',this.textmessage)
    message.type = "sent";
    message.message = this.textmessage;
    message.name = "Me";
    message.time = this.getCurrentTime();
    message.date = new Date();
    this.textChatArray.push(message)
    this.textmessage = " "
  }

  private onItemElementsChanged(): void {
      this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.scrollContainer.scroll({
      top: this.scrollContainer.scrollHeight,
      left: 0,
      behavior: 'smooth'
    });
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
    return time;
  }

}
