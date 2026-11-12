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
  appearance?: 'switch' | 'outline';
  onApplied?: (online: boolean) => void;
}

export default function DriverAvailabilityControl({ isOnline, onChange, coords, compact = false, appearance, onApplied }: Props) {
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
      if (result.applied) {
        toast.success(next ? "You're now online!" : "You're now offline");
        onApplied?.(next);
      }
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

  if (appearance === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isOnline}
        aria-label="Driver availability"
        aria-busy={updating}
        disabled={updating}
        onClick={request}
        className="relative flex min-h-11 w-[70px] shrink-0 items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
      >
        <span aria-hidden="true" className={`relative block h-[34px] w-full rounded-full border transition-colors ${isOnline ? 'border-primary bg-primary' : 'border-[#e4e7ed] bg-[#f3f4f6]'}`}>
          <span className={`absolute top-[3px] grid size-[26px] place-items-center rounded-full bg-white shadow transition-transform ${isOnline ? 'translate-x-[38px]' : 'translate-x-[3px]'}`}>
            {updating && <Loader2 className="size-3.5 animate-spin text-primary" />}
          </span>
        </span>
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={request} disabled={updating} aria-busy={updating} aria-label={isOnline ? 'Go offline' : 'Go online'}
        className={appearance === 'outline' ? 'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-primary px-4 text-[15px] font-semibold text-[#111] disabled:opacity-60' : compact ? 'inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold disabled:opacity-60' : 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 font-bold disabled:opacity-60'}
        style={appearance === 'outline' ? undefined : { background: isOnline ? '#FDE8E6' : 'hsl(var(--primary))', color: isOnline ? 'hsl(var(--primary))' : '#fff' }}>
        {updating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : appearance !== 'outline' && <Power className="h-4 w-4" aria-hidden />}
        {updating ? 'Updating…' : isOnline ? 'Go offline' : 'Go online'}
      </button>
      {errorMessage && <span role="alert" className="max-w-40 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold" style={{ color: compact ? '#111111' : '#B81104' }}>{errorMessage}</span>}
    </>
  );
}
