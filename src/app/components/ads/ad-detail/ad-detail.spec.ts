import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdDetail } from './ad-detail';

describe('AdDetail', () => {
  let component: AdDetail;
  let fixture: ComponentFixture<AdDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
