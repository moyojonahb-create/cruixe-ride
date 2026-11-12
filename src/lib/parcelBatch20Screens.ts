/** Parcel batch 2: twenty exact frames from the CruiXe Main Figma file.
 * UI design states only; do not infer dispatch, payment, PIN or actual delivery status from these definitions.
 */
export type ParcelRole = 'driver' | 'rider' | 'recipient';
export type ParcelStage = 'request' | 'pickup' | 'navigation' | 'collected' | 'delivery' | 'verify' | 'proof' | 'cash' | 'delivered' | 'issue';
export interface ParcelScreenDefinition {
  id: string;
  figmaNode: string;
  title: string;
  description: string;
  eyebrow: string;
  primary: string;
  secondary: string;
  role: ParcelRole;
  stage: ParcelStage;
}
export const PARCEL_BATCH_20: readonly ParcelScreenDefinition[] = [
  {
    "id": "driver-request",
    "figmaNode": "1210:116",
    "title": "New parcel delivery",
    "description": "Sender pickup and recipient drop-off request",
    "eyebrow": "PARCEL REQUEST",
    "primary": "View request",
    "secondary": "Requests",
    "role": "driver",
    "stage": "request"
  },
  {
    "id": "driver-accepted",
    "figmaNode": "1210:225",
    "title": "Collect the parcel",
    "description": "Parcel offer accepted. Go to the sender pickup.",
    "eyebrow": "PARCEL ACCEPTED",
    "primary": "Navigate to sender",
    "secondary": "Requests",
    "role": "driver",
    "stage": "pickup"
  },
  {
    "id": "driver-navigate-pickup",
    "figmaNode": "1211:126",
    "title": "Picking up parcel",
    "description": "Follow the route to the parcel sender.",
    "eyebrow": "PICKING UP PARCEL",
    "primary": "Call sender",
    "secondary": "Message",
    "role": "driver",
    "stage": "navigation"
  },
  {
    "id": "driver-arrived-sender",
    "figmaNode": "1210:312",
    "title": "Parcel collection",
    "description": "Confirm the package matches the sender's photo.",
    "eyebrow": "AT PICKUP",
    "primary": "Verify parcel",
    "secondary": "View parcel photo",
    "role": "driver",
    "stage": "pickup"
  },
  {
    "id": "driver-collected",
    "figmaNode": "1211:244",
    "title": "Parcel collected",
    "description": "The sender has handed over the parcel.",
    "eyebrow": "PARCEL COLLECTED",
    "primary": "Start delivery",
    "secondary": "Requests",
    "role": "driver",
    "stage": "collected"
  },
  {
    "id": "driver-in-transit",
    "figmaNode": "1211:313",
    "title": "Delivering parcel",
    "description": "Follow the route to the recipient's address.",
    "eyebrow": "PARCEL IN TRANSIT",
    "primary": "At recipient",
    "secondary": "Safety",
    "role": "driver",
    "stage": "navigation"
  },
  {
    "id": "driver-arrived-recipient",
    "figmaNode": "1210:397",
    "title": "Meet the recipient",
    "description": "Confirm the recipient before handing over the parcel.",
    "eyebrow": "AT DESTINATION",
    "primary": "Verify delivery",
    "secondary": "Contact recipient",
    "role": "driver",
    "stage": "delivery"
  },
  {
    "id": "driver-verify-code",
    "figmaNode": "1210:482",
    "title": "Verify delivery code",
    "description": "Ask the recipient for their private four-digit code.",
    "eyebrow": "PRIVATE HANDOVER",
    "primary": "Confirm delivery code",
    "secondary": "Retry",
    "role": "driver",
    "stage": "verify"
  },
  {
    "id": "driver-proof",
    "figmaNode": "1232:166",
    "title": "Confirm parcel handover",
    "description": "Only confirm after the recipient has the parcel.",
    "eyebrow": "RECIPIENT CODE MATCHED",
    "primary": "Confirm handover",
    "secondary": "Problem",
    "role": "driver",
    "stage": "proof"
  },
  {
    "id": "driver-cash",
    "figmaNode": "1211:428",
    "title": "Parcel payment",
    "description": "Check cash collection without marking it received early.",
    "eyebrow": "PARCEL FARE",
    "primary": "Cash collected",
    "secondary": "Not received",
    "role": "driver",
    "stage": "cash"
  },
  {
    "id": "driver-delivered",
    "figmaNode": "1210:551",
    "title": "Delivery completed",
    "description": "Parcel handed over to the recipient.",
    "eyebrow": "PARCEL DELIVERED",
    "primary": "Return to waiting",
    "secondary": "Receipt",
    "role": "driver",
    "stage": "delivered"
  },
  {
    "id": "rider-pickup",
    "figmaNode": "491:617",
    "title": "Parcel pickup & handover",
    "description": "Prepare your package for the courier.",
    "eyebrow": "PICKUP & HANDOVER",
    "primary": "View courier",
    "secondary": "Collection details",
    "role": "rider",
    "stage": "pickup"
  },
  {
    "id": "rider-tracking",
    "figmaNode": "491:660",
    "title": "Track your parcel",
    "description": "Live updates until delivery.",
    "eyebrow": "IN TRANSIT",
    "primary": "Contact courier",
    "secondary": "Delivery journey",
    "role": "rider",
    "stage": "navigation"
  },
  {
    "id": "rider-delivered",
    "figmaNode": "491:711",
    "title": "Parcel delivered",
    "description": "Your parcel has reached its destination.",
    "eyebrow": "DELIVERED",
    "primary": "View delivery receipt",
    "secondary": "Back to Ride",
    "role": "rider",
    "stage": "delivered"
  },
  {
    "id": "rider-issue",
    "figmaNode": "491:735",
    "title": "Delivery issue",
    "description": "Your parcel needs attention.",
    "eyebrow": "DELIVERY PROBLEM",
    "primary": "Contact support",
    "secondary": "Back to activity",
    "role": "rider",
    "stage": "issue"
  },
  {
    "id": "rider-resolution",
    "figmaNode": "565:576",
    "title": "Delivery options",
    "description": "Choose a safe next step after an unsuccessful attempt.",
    "eyebrow": "DELIVERY OPTIONS",
    "primary": "Review retry",
    "secondary": "Return to sender",
    "role": "rider",
    "stage": "issue"
  },
  {
    "id": "recipient-live",
    "figmaNode": "565:490",
    "title": "Your parcel is on the way",
    "description": "Your delivery journey is live.",
    "eyebrow": "RECIPIENT TRACKING",
    "primary": "View journey",
    "secondary": "Contact courier",
    "role": "recipient",
    "stage": "navigation"
  },
  {
    "id": "rider-redelivery-review",
    "figmaNode": "572:460",
    "title": "Delivery review",
    "description": "Review a possible second delivery attempt.",
    "eyebrow": "RETRY DELIVERY",
    "primary": "Request review",
    "secondary": "Back",
    "role": "rider",
    "stage": "issue"
  },
  {
    "id": "rider-return-review",
    "figmaNode": "573:410",
    "title": "Return review",
    "description": "Review a return-to-sender request.",
    "eyebrow": "RETURN TO SENDER",
    "primary": "Request return",
    "secondary": "Back",
    "role": "rider",
    "stage": "issue"
  },
  {
    "id": "recipient-verify",
    "figmaNode": "546:1066",
    "title": "Verify parcel delivery",
    "description": "Confirm the package only when it is in your hands.",
    "eyebrow": "PRIVATE HANDOVER",
    "primary": "Confirm received",
    "secondary": "Report a problem",
    "role": "recipient",
    "stage": "verify"
  }
] as const;
export function getParcelScreen(id:string):ParcelScreenDefinition|undefined {
 return PARCEL_BATCH_20.find(screen=>screen.id===id);
}
