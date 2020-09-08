import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveroomComponent } from './leaveroom.component';

describe('LeaveroomComponent', () => {
  let component: LeaveroomComponent;
  let fixture: ComponentFixture<LeaveroomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeaveroomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeaveroomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
