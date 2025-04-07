import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSimpleProductComponent } from './create-simple-product.component';

describe('CreateSimpleProductComponent', () => {
  let component: CreateSimpleProductComponent;
  let fixture: ComponentFixture<CreateSimpleProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSimpleProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateSimpleProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
