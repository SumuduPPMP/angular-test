import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule} from '@angular/router';
import { FormsModule} from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CreateroomComponent } from './createroom/createroom.component';
import { RoomComponent } from './room/room.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LeaveroomComponent } from './leaveroom/leaveroom.component';
import { ChatComponent } from './chat/chat.component';
import { RoomfullComponent } from './roomfull/roomfull.component';

@NgModule({
  declarations: [
    AppComponent,
    CreateroomComponent,
    RoomComponent,
    LeaveroomComponent,
    ChatComponent,
    RoomfullComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    RouterModule.forRoot([
      {path:'', component:CreateroomComponent},
      {path:'room/:roomID', component:RoomComponent},
      {path:'leaveroom', component:LeaveroomComponent},
      {path:'roomfull', component:RoomfullComponent},

    ]),
    NgbModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
