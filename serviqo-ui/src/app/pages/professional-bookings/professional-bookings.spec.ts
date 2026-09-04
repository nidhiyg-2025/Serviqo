import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalBookings } from './professional-bookings';

describe('ProfessionalBookings', () => {
  let component: ProfessionalBookings;
  let fixture: ComponentFixture<ProfessionalBookings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalBookings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfessionalBookings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
