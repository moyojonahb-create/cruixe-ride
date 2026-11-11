import { describe, expect, it } from 'vitest';
import { getDriverTripPresentation } from '@/lib/driverTripPresentation';

describe('Driver live trip presentation', () => {
  it.each([
    ['accepted', '1153:105', 'OFFER ACCEPTED', "I've arrived"],
    ['enroute_pickup', '1153:165', 'EN ROUTE TO PICKUP', "I've arrived"],
    ['enroute', '1153:165', 'EN ROUTE TO PICKUP', "I've arrived"],
    ['arrived', '1153:225', 'ARRIVED AT PICKUP', 'Passenger onboard · Start trip'],
    ['in_progress', '1182:281', 'EN ROUTE TO DESTINATION', 'Complete trip'],
    ['ongoing', '1182:281', 'EN ROUTE TO DESTINATION', 'Complete trip'],
  ])('maps backend %s to the Figma live-navigation display', (status, figmaNode, eyebrow, nextAction) => {
    const result = getDriverTripPresentation(status, 'Rider A', 'City Centre');
    expect(result.figmaNode).toBe(figmaNode);
    expect(result.eyebrow).toBe(eyebrow);
    expect(result.nextAction).toBe(nextAction);
  });

  it('uses live passenger and location strings, not sample Figma rider/place names', () => {
    const accepted = getDriverTripPresentation('accepted', 'Driver Test Rider', 'Depot');
    const enRoute = getDriverTripPresentation('in_progress', 'Driver Test Rider', 'Depot');
    expect(accepted.description).toContain('Driver Test Rider');
    expect(enRoute.title).toContain('Depot');
    expect(accepted.description).not.toContain('Tariro');
  });

  it('does not imply an unknown backend state is approved or completed', () => {
    expect(getDriverTripPresentation('pending', 'Person', 'Destination').eyebrow).toBe('DRIVER TRIP');
  });
});
