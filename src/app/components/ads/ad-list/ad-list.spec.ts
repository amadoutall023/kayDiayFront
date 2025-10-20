import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdList } from './ad-list';

describe('AdList', () => {
  let component: AdList;
  let fixture: ComponentFixture<AdList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
