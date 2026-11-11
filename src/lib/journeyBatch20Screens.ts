/** Twenty Figma-sourced screen definitions, intentionally separate from backend state.
 * A frame is not equivalent to a deployed workflow until its integration is complete.
 */
export type JourneyGroup = 'shared' | 'guest' | 'schedule' | 'matching';
export interface JourneyScreenDefinition {
  id: string;
  figmaNode: string;
  title: string;
  description: string;
  primary: string;
  secondary: string;
  group: JourneyGroup;
}
export const JOURNEY_BATCH_20: readonly JourneyScreenDefinition[] = [
  {
    "id": "shared-search",
    "figmaNode": "526:410",
    "title": "Finding shared ride",
    "description": "Checking nearby compatible trips.",
    "primary": "Keep searching",
    "secondary": "Cancel",
    "group": "shared"
  },
  {
    "id": "shared-match",
    "figmaNode": "526:483",
    "title": "You're matched!",
    "description": "A driver has been assigned for your shared trip.",
    "primary": "Track pickup",
    "secondary": "Share trip",
    "group": "shared"
  },
  {
    "id": "shared-rider-joining",
    "figmaNode": "526:729",
    "title": "Another rider is joining",
    "description": "Your driver has an additional pickup.",
    "primary": "View updated route",
    "secondary": "Close",
    "group": "shared"
  },
  {
    "id": "shared-enroute",
    "figmaNode": "526:562",
    "title": "Driver coming to you",
    "description": "Your driver is heading to your pickup.",
    "primary": "Call driver",
    "secondary": "Cancel ride",
    "group": "shared"
  },
  {
    "id": "shared-boarding",
    "figmaNode": "526:648",
    "title": "Driver arrived",
    "description": "Your driver is waiting at your pickup point.",
    "primary": "I'm coming",
    "secondary": "Call driver",
    "group": "shared"
  },
  {
    "id": "shared-in-progress-a",
    "figmaNode": "526:819",
    "title": "Your shared trip",
    "description": "Your shared journey is in progress.",
    "primary": "Share trip",
    "secondary": "Safety",
    "group": "shared"
  },
  {
    "id": "shared-in-progress-b",
    "figmaNode": "526:909",
    "title": "You're on your way",
    "description": "Your pickup is complete.",
    "primary": "Share trip",
    "secondary": "Safety",
    "group": "shared"
  },
  {
    "id": "guest-details",
    "figmaNode": "504:410",
    "title": "Book for someone else",
    "description": "Enter the passenger details for this booking.",
    "primary": "Continue",
    "secondary": "Back",
    "group": "guest"
  },
  {
    "id": "guest-share-link",
    "figmaNode": "513:410",
    "title": "Share ride link",
    "description": "Send the passenger a secure invitation.",
    "primary": "Share invitation",
    "secondary": "Back",
    "group": "guest"
  },
  {
    "id": "guest-booker-status",
    "figmaNode": "513:503",
    "title": "Booking status",
    "description": "Follow the ride you booked for someone else.",
    "primary": "Track booking",
    "secondary": "Share invitation",
    "group": "guest"
  },
  {
    "id": "guest-passenger-connected",
    "figmaNode": "514:410",
    "title": "Connected to ride",
    "description": "You can follow the ride booked for you.",
    "primary": "Track ride",
    "secondary": "Contact booker",
    "group": "guest"
  },
  {
    "id": "guest-invitation",
    "figmaNode": "536:760",
    "title": "Guest ride invitation",
    "description": "Verify you are the intended passenger.",
    "primary": "Connect",
    "secondary": "Not me",
    "group": "guest"
  },
  {
    "id": "guest-invalid-link",
    "figmaNode": "536:832",
    "title": "This link can't be used",
    "description": "The invitation may have expired or been revoked.",
    "primary": "Request fresh invitation",
    "secondary": "Back",
    "group": "guest"
  },
  {
    "id": "schedule-create",
    "figmaNode": "482:718",
    "title": "Schedule a ride",
    "description": "Choose when and where you want to travel.",
    "primary": "Review schedule",
    "secondary": "Back",
    "group": "schedule"
  },
  {
    "id": "schedule-review",
    "figmaNode": "482:772",
    "title": "Review scheduled ride",
    "description": "Confirm your journey before scheduling.",
    "primary": "Confirm schedule",
    "secondary": "Edit",
    "group": "schedule"
  },
  {
    "id": "schedule-confirmed",
    "figmaNode": "482:813",
    "title": "Your ride is scheduled",
    "description": "You'll receive updates before pickup.",
    "primary": "View upcoming rides",
    "secondary": "Back to Ride",
    "group": "schedule"
  },
  {
    "id": "schedule-upcoming",
    "figmaNode": "546:630",
    "title": "Upcoming rides",
    "description": "Manage your confirmed future bookings.",
    "primary": "Manage ride",
    "secondary": "Back to Ride",
    "group": "schedule"
  },
  {
    "id": "schedule-manage",
    "figmaNode": "536:672",
    "title": "Manage scheduled ride",
    "description": "Review details before making changes.",
    "primary": "Save changes",
    "secondary": "Cancel ride",
    "group": "schedule"
  },
  {
    "id": "matching-offers-expired",
    "figmaNode": "536:533",
    "title": "Those offers expired",
    "description": "None of the previous driver offers are available now.",
    "primary": "Request again",
    "secondary": "Adjust fare",
    "group": "matching"
  },
  {
    "id": "matching-confirmed",
    "figmaNode": "631:96",
    "title": "Ride confirmation",
    "description": "Review your ride details before dispatch.",
    "primary": "Confirm request",
    "secondary": "Back",
    "group": "matching"
  }
] as const;
export function getJourneyScreen(id: string): JourneyScreenDefinition | undefined {
  return JOURNEY_BATCH_20.find((screen) => screen.id === id);
}
