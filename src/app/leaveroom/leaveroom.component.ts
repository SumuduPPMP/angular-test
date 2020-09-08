import { Component, OnInit } from '@angular/core';
import { DataService } from './../data.service';

@Component({
  selector: 'app-leaveroom',
  templateUrl: './leaveroom.component.html',
  styleUrls: ['./leaveroom.component.css']
})
export class LeaveroomComponent implements OnInit {

  constructor(private data: DataService) { }
  roomID;
  ngOnInit(): void {
  }

}
