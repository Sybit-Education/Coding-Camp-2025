import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KategorieComponent } from './kategorie.component';

describe('KategorieComponent', () => {
  let component: KategorieComponent;
  let fixture: ComponentFixture<KategorieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KategorieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KategorieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
