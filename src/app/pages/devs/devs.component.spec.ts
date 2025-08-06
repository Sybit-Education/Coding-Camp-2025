import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevsComponent } from './devs.component';

describe('DevsComponent', () => {
  let component: DevsComponent;
  let fixture: ComponentFixture<DevsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
