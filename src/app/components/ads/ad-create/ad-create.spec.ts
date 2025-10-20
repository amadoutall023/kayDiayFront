import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdCreate } from './ad-create';

describe('AdCreate', () => {
  let component: AdCreate;
  let fixture: ComponentFixture<AdCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
