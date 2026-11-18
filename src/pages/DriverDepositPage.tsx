import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DriverWalletFrame, { walletAction, walletPanel } from "@/components/driver/DriverWalletFrame";
import { walletDeposit } from "@/lib/walletApi";

const ECASH_NUMBER = "+263 778 553 169";

export default function DriverDepositPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("5");
  const [phone, setPhone] = useState("");
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const [step, setStep] = useState<'edit' | 'review' | 'submitted'>('edit');
  const submissionLock = useRef(false);
  const review = () => {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !phone.trim() || !ref.trim() || !file) {
      toast.error('Enter a valid amount, phone and reference, and upload payment proof.');
      return;
    }
    setStep('review');
  };

  const submit = async () => {
    if (submissionLock.current) return;
    if (!user) { toast.error("Please sign in"); return; }
    submissionLock.current = true;
    setBusy(true);
    try {
      const amt = Number(amount);
      if (!isFinite(amt) || amt <= 0) throw new Error("Enter a valid USD amount.");
      if (!phone.trim()) throw new Error("Enter EcoCash phone used.");
      if (!ref.trim()) throw new Error("Enter EcoCash reference.");
      if (!file) throw new Error("Please upload proof of payment.");

      // Upload proof
      const safeName = file.name.split(" ").join("_");
      const path = `${user.id}/${Date.now()}_${safeName}`;
      const up = await supabase.storage.from("deposit-proofs").upload(path, file, { upsert: false });
      if (up.error) throw up.error;

      const res = await walletDeposit({
        amount: amt,
        wallet_type: "driver",
        ecocash_phone: phone.trim(),
        ecocash_reference: ref.trim(),
        proof_path: path,
      });
      if (!res?.ok) throw new Error(res?.reason || "Failed to submit deposit");

      toast.success("Deposit request submitted! Admin will verify and credit your wallet.");
      setRef("");
      setFile(null);
      setStep('submitted');
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to submit deposit request.");
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  };

  const displayedAmount = Number(amount).toFixed(2);
  if (step === 'submitted') return <DriverWalletFrame frame="1340:140" title="Payment processing" onBack={() => navigate('/driver/wallet')} footer={<Button className={walletAction} onClick={() => navigate('/driver/wallet?tab=deposits')}>View Wallet Activity</Button>}>
    <section className="rounded-[20px] bg-primary px-5 py-10 text-center text-white">
      <h2 className="text-xl font-bold">Awaiting verification</h2>
      <p className="mt-2 text-sm">Your EcoCash payment proof was submitted for review.</p>
    </section>
    <section className={walletPanel}><h2 className="font-bold">Payment in review</h2><p className="mt-3">USD {displayedAmount} · EcoCash</p><p className="mt-2 text-xs text-muted-foreground">Check Wallet Activity before making another payment.</p></section>
  </DriverWalletFrame>;
  if (step === 'review') return <DriverWalletFrame frame="1338:140" title="Review Top-Up" onBack={() => { if (!busy) setStep('edit'); }} footer={<Button className={walletAction} disabled={busy} onClick={() => void submit()}>{busy ? 'Submitting…' : 'Submit deposit request'}</Button>}>
    <h2 className="text-xl font-bold">Review before submitting</h2>
    <section className="rounded-[20px] bg-primary p-5 text-white"><p className="text-xs font-bold">TOP-UP AMOUNT</p><strong className="mt-3 block text-4xl">${displayedAmount}</strong></section>
    <section className={walletPanel}>
      <h2 className="font-bold">Payment details</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-2"><dt>Method</dt><dd className="font-semibold">EcoCash</dd></div>
        <div className="flex justify-between gap-2"><dt>Reference</dt><dd className="break-all font-semibold">{ref.trim()}</dd></div>
        <div className="flex justify-between gap-2"><dt>Proof</dt><dd className="break-all font-semibold">{file?.name}</dd></div>
      </dl>
    </section>
  </DriverWalletFrame>;

  return (
    <DriverWalletFrame frame="1336:140" title="Top Up Wallet" onBack={() => navigate(-1)} footer={<Button onClick={review} className={walletAction}>Review Top-Up</Button>}>
      <section className={walletPanel}>
        <h2 className="mb-2 text-sm font-bold">EcoCash payment instructions</h2>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Pay USD EcoCash to: <span className="font-bold text-foreground">{ECASH_NUMBER}</span></li>
            <li>Use reference: <span className="font-bold text-foreground">Your Name + Phone</span></li>
            <li>Take a screenshot/photo of the confirmation</li>
            <li>Upload proof below and submit</li>
          </ol>
      </section>

        {/* Form */}
        <div className={`space-y-3 ${walletPanel}`}>
          <h2 className="font-bold">Choose top-up amount</h2>
          <div className="grid grid-cols-4 gap-2">
            {['5', '10', '20', '50'].map(preset => <Button key={preset} type="button" variant={amount === preset ? 'default' : 'outline'} aria-pressed={amount === preset} onClick={() => setAmount(preset)}>${preset}</Button>)}
          </div>
          <div>
            <label htmlFor="deposit-amount" className="text-sm font-medium">Amount (USD)</label>
            <Input id="deposit-amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" />
          </div>
          <div>
            <label htmlFor="deposit-phone" className="text-sm font-medium">EcoCash phone used</label>
            <Input id="deposit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+263..." />
          </div>
          <div>
            <label htmlFor="deposit-reference" className="text-sm font-medium">EcoCash reference</label>
            <Input id="deposit-reference" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transaction reference" />
          </div>
          <div>
            <label className="text-sm font-medium">Proof of payment</label>
            <div className="mt-1">
              <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Upload screenshot/photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

        </div>
    </DriverWalletFrame>
  );
}
