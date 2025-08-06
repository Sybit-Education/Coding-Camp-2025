import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KategorieCardComponent } from './kategorie-card.component';

describe('KategorieCardComponent', () => {
  let component: KategorieCardComponent;
  let fixture: ComponentFixture<KategorieCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KategorieCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KategorieCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
