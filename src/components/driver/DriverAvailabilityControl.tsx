import { useEffect, useState } from 'react';
import { Loader2, Power } from 'lucide-react';
import { toast } from 'sonner';
import { DriverEligibilityError, subscribeDriverAvailability, updateDriverAvailability } from '@/lib/driverAvailability';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  isOnline: boolean;
  onChange: (online: boolean) => void;
  coords?: { lat: number; lng: number } | null;
  compact?: boolean;
}

export default function DriverAvailabilityControl({ isOnline, onChange, coords, compact = false }: Props) {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => subscribeDriverAvailability(onChange), [onChange]);

  const commit = async (next: boolean) => {
    if (updating) return;
    setErrorMessage(null);
    setUpdating(true);
    try {
      const result = await updateDriverAvailability(user?.id ?? '', next, coords);
      if (result.applied) toast.success(next ? "You're now online!" : "You're now offline");
    } catch (error) {
      setErrorMessage((error as Error).message || 'Could not update availability');
      toast.error(error instanceof DriverEligibilityError ? 'Cannot go online' : 'Failed to update status', { description: (error as Error).message });
    } finally {
      setUpdating(false);
    }
  };

  const request = () => {
    void commit(!isOnline);
  };

  return (
    <>
      <button type="button" onClick={request} disabled={updating} aria-busy={updating} aria-label={isOnline ? 'Go offline' : 'Go online'}
        className={compact ? 'inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold disabled:opacity-60' : 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 font-bold disabled:opacity-60'}
        style={{ background: isOnline ? '#FDE8E6' : '#B81104', color: isOnline ? '#B81104' : '#fff' }}>
        {updating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Power className="h-4 w-4" aria-hidden />}
        {updating ? 'Updating…' : isOnline ? 'Go offline' : 'Go online'}
      </button>
      {errorMessage && <span role="alert" className="max-w-40 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold" style={{ color: compact ? '#111111' : '#B81104' }}>{errorMessage}</span>}
    </>
  );
}
