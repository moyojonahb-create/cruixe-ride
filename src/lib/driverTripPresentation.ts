/**
 * Presentation mapping for the server-authoritative CruiXe driver trip lifecycle.
 * Figma: 1153:105 / 1153:165 / 1153:225 / 1182:198 / 1182:281.
 * This is display text ONLY: never alters ride status or fakes an ETA.
 */
export interface DriverTripPresentation {
  figmaNode: string;
  eyebrow: string;
  title: string;
  description: string;
  nextAction: string;
}
export function getDriverTripPresentation(status: string, passengerName: string, destination: string): DriverTripPresentation {
  switch (status) {
    case 'accepted':
      return {
        figmaNode: '1153:105',
        eyebrow: 'OFFER ACCEPTED',
        title: 'Your offer was accepted',
        description: `${passengerName} confirmed your offer. Head to the agreed pickup point.`,
        nextAction: "I've arrived",
      };
    case 'enroute':
    case 'enroute_pickup':
      return {
        figmaNode: '1153:165',
        eyebrow: 'EN ROUTE TO PICKUP',
        title: `Picking up ${passengerName}`,
        description: 'Follow the live route to the agreed pickup point.',
        nextAction: "I've arrived",
      };
    case 'arrived':
      return {
        figmaNode: '1153:225',
        eyebrow: 'ARRIVED AT PICKUP',
        title: "You've arrived",
        description: `Waiting for ${passengerName} at the pickup point.`,
        nextAction: 'Passenger onboard · Start trip',
      };
    case 'in_progress':
    case 'ongoing':
      return {
        figmaNode: '1182:281',
        eyebrow: 'EN ROUTE TO DESTINATION',
        title: `Driving to ${destination}`,
        description: 'Trip active. Check that passengers exit safely before completing.',
        nextAction: 'Complete trip',
      };
    default:
      return {
        figmaNode: '1153:105',
        eyebrow: 'DRIVER TRIP',
        title: 'Your active trip',
        description: 'Trip status is updating.',
        nextAction: 'View trip',
      };
  }
}
