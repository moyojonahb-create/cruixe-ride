/** Exact Figma source map for the 20 non-wallet communication screens.
 * The call/message state must be supplied by real authenticated transport, not inferred here.
 */
export type CommunicationStatus = 'message' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'failed';
export type CommunicationRole = 'rider' | 'sender' | 'recipient' | 'student';
export interface CommunicationScreenDefinition {
 id:string;figmaNode:string;role:CommunicationRole;label:string;state:CommunicationStatus;title:string;eyebrow:string;
}
export const COMMUNICATION_BATCH_20:readonly CommunicationScreenDefinition[] = [
  {
    "id": "rider-message",
    "figmaNode": "1240:116",
    "role": "rider",
    "label": "Rider",
    "state": "message",
    "title": "Chat with Rider",
    "eyebrow": "IN-APP MESSAGES"
  },
  {
    "id": "rider-connecting",
    "figmaNode": "1240:169",
    "role": "rider",
    "label": "Rider",
    "state": "connecting",
    "title": "Calling Rider",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "rider-ringing",
    "figmaNode": "1240:214",
    "role": "rider",
    "label": "Rider",
    "state": "ringing",
    "title": "Calling Rider",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "rider-connected",
    "figmaNode": "1240:259",
    "role": "rider",
    "label": "Rider",
    "state": "connected",
    "title": "Calling Rider",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "rider-ended",
    "figmaNode": "1240:301",
    "role": "rider",
    "label": "Rider",
    "state": "ended",
    "title": "Calling Rider",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "rider-failed",
    "figmaNode": "1240:329",
    "role": "rider",
    "label": "Rider",
    "state": "failed",
    "title": "Calling Rider",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "sender-message",
    "figmaNode": "1253:117",
    "role": "sender",
    "label": "Parcel Sender",
    "state": "message",
    "title": "Chat with Parcel Sender",
    "eyebrow": "IN-APP MESSAGES"
  },
  {
    "id": "sender-connecting",
    "figmaNode": "1253:167",
    "role": "sender",
    "label": "Parcel Sender",
    "state": "connecting",
    "title": "Calling Parcel Sender",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "sender-ringing",
    "figmaNode": "1253:211",
    "role": "sender",
    "label": "Parcel Sender",
    "state": "ringing",
    "title": "Calling Parcel Sender",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "sender-connected",
    "figmaNode": "1253:255",
    "role": "sender",
    "label": "Parcel Sender",
    "state": "connected",
    "title": "Calling Parcel Sender",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "sender-ended",
    "figmaNode": "1253:297",
    "role": "sender",
    "label": "Parcel Sender",
    "state": "ended",
    "title": "Calling Parcel Sender",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "sender-failed",
    "figmaNode": "1253:324",
    "role": "sender",
    "label": "Parcel Sender",
    "state": "failed",
    "title": "Calling Parcel Sender",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "recipient-message",
    "figmaNode": "1253:352",
    "role": "recipient",
    "label": "Parcel Recipient",
    "state": "message",
    "title": "Chat with Parcel Recipient",
    "eyebrow": "IN-APP MESSAGES"
  },
  {
    "id": "recipient-connecting",
    "figmaNode": "1253:402",
    "role": "recipient",
    "label": "Parcel Recipient",
    "state": "connecting",
    "title": "Calling Parcel Recipient",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "recipient-ringing",
    "figmaNode": "1253:446",
    "role": "recipient",
    "label": "Parcel Recipient",
    "state": "ringing",
    "title": "Calling Parcel Recipient",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "recipient-connected",
    "figmaNode": "1253:490",
    "role": "recipient",
    "label": "Parcel Recipient",
    "state": "connected",
    "title": "Calling Parcel Recipient",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "recipient-ended",
    "figmaNode": "1253:532",
    "role": "recipient",
    "label": "Parcel Recipient",
    "state": "ended",
    "title": "Calling Parcel Recipient",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "recipient-failed",
    "figmaNode": "1253:559",
    "role": "recipient",
    "label": "Parcel Recipient",
    "state": "failed",
    "title": "Calling Parcel Recipient",
    "eyebrow": "IN-APP CALL"
  },
  {
    "id": "student-message",
    "figmaNode": "1270:729",
    "role": "student",
    "label": "Student Rider",
    "state": "message",
    "title": "Chat with Student Rider",
    "eyebrow": "IN-APP MESSAGES"
  },
  {
    "id": "student-connecting",
    "figmaNode": "1270:779",
    "role": "student",
    "label": "Student Rider",
    "state": "connecting",
    "title": "Calling Student Rider",
    "eyebrow": "IN-APP CALL"
  }
] as const;
export function getCommunicationState(id:string): CommunicationScreenDefinition|undefined {
 return COMMUNICATION_BATCH_20.find(x=>x.id===id);
}
