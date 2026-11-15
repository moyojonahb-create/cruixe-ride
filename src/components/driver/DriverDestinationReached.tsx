import type { ReactNode } from 'react';
import DriverLifecycleLayout from './DriverLifecycleLayout';
import { DriverDestinationBody } from './DriverFinishBodies';
interface DriverDestinationReachedProps {
  passengerName: string; passengerCount: number | null; destination: string; fare: number; paymentMethod: string;
  confirming: boolean; farFromDropoff: boolean; onBack: () => void; onConfirm: () => void; mapNode?: ReactNode;
}
export default function DriverDestinationReached({ mapNode, onBack, ...props }: DriverDestinationReachedProps) {
  return <section role="dialog" aria-modal="true" aria-label="Destination reached" className="fixed inset-0 z-[130] overflow-y-auto bg-white">
    <DriverLifecycleLayout frameId="1185:115" map={mapNode} onBack={onBack} busy={props.confirming}><DriverDestinationBody {...props} /></DriverLifecycleLayout>
  </section>;
}
