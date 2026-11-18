import { Link } from 'react-router-dom';
import { useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, MessageSquare, DollarSign, Clock, Navigation, Shield, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { submitDispute } from '@/lib/businessApi';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DisputeFormProps {
  rideId: string;
  role?: 'rider' | 'driver';
  /** Custom trigger element — e.g. the Safety sheet's "Report a problem"
   * row. Falls back to the default outline button when omitted. */
  trigger?: ReactNode;
}

const categories = [
  { id: 'fare_dispute', label: 'Fare Issue', icon: DollarSign, description: 'Incorrect fare or overcharge' },
  { id: 'route_issue', label: 'Route Problem', icon: Navigation, description: 'Driver took a wrong route' },
  { id: 'safety_concern', label: 'Safety Concern', icon: Shield, description: 'Unsafe driving or behavior' },
  { id: 'late_arrival', label: 'Late Arrival', icon: Clock, description: 'Driver arrived very late' },
  { id: 'other', label: 'Other', icon: MessageSquare, description: 'Other issue' },
];

export default function DisputeForm({ rideId, role = 'rider', trigger }: DisputeFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [safetySubmitted, setSafetySubmitted] = useState(false);
  const submissionInFlight = useRef(false);

  const updateOpen = (next: boolean) => {
    if (submissionInFlight.current) return;
    setOpen(next);
    if (!next) setSafetySubmitted(false);
  };

  const handleSubmit = async () => {
    if (!user || !category || description.trim().length < 10 || submissionInFlight.current) return;
    submissionInFlight.current = true;
    setSubmitting(true);

    try {
      const result = await submitDispute({
        ride_id: rideId,
        reporter_role: role,
        category,
        description: description.trim(),
      });
      if (result.success !== true) throw new Error('Report was not acknowledged.');
      if (role === 'driver' && category === 'safety_concern') {
        setSafetySubmitted(true);
      } else {
        toast.success('Dispute submitted. Our team will review it shortly.');
        setOpen(false);
      }
      setCategory(null);
      setDescription('');
    } catch (err) {
      console.error('Failed to submit dispute:', err);
      toast.error('Failed to submit dispute. Please try again.');
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={updateOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      {safetySubmitted ? <DialogContent data-figma-node="1376:173" className="max-w-[440px] rounded-[22px] bg-[#faf9f8] font-['Poppins',system-ui,sans-serif]">
        <DialogHeader><DialogTitle>Safety Incident Submitted</DialogTitle></DialogHeader>
        <section className="rounded-[18px] border-t-[6px] border-[#161118] bg-primary p-5 text-center text-white">
          <h2 className="font-bold">Safety report received</h2>
          <DialogDescription className="mt-2 text-xs text-white">The server accepted your safety report.</DialogDescription>
        </section>
        <section className="rounded-[18px] border-l-[5px] border-[#161118] bg-white p-4">
          <h2 className="font-bold">Case overview</h2>
          <dl className="mt-3 divide-y divide-border text-sm">
            <div className="py-3"><dt className="font-semibold">Incident type</dt><dd className="mt-1 text-muted-foreground">Safety concern</dd></div>
            <div className="py-3"><dt className="font-semibold">Report status</dt><dd className="mt-1 text-muted-foreground">Submitted</dd></div>
          </dl>
        </section>
        <footer className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => updateOpen(false)}>Close</Button>
          <Button asChild><Link to="/driver/cases/safety">Track Safety Report</Link></Button>
        </footer>
      </DialogContent> : <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report a Problem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">What went wrong?</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    category === cat.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <cat.icon className={`h-4 w-4 mb-1 ${category === cat.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-xs font-semibold">{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          {category && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Tell us more</p>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{description.length}/500</p>
            </div>
          )}

          <Button
            className="w-full gap-2"
            disabled={!category || description.trim().length < 10 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Report
          </Button>
        </div>
      </DialogContent>}
    </Dialog>
  );
}
