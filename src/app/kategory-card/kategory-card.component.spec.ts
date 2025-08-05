import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KategoryCardComponent } from './kategory-card.component';

describe('KategoryCardComponent', () => {
  let component: KategoryCardComponent;
  let fixture: ComponentFixture<KategoryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KategoryCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KategoryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
