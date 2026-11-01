import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, ShieldCheck, Loader2, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface DriverSelfieCheckProps {
  open: boolean;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

export default function DriverSelfieCheck({ open, onSubmitted, onCancel }: DriverSelfieCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lifecycleRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);
  const [step, setStep] = useState<'prompt' | 'camera' | 'preview' | 'verifying' | 'done' | 'error'>('prompt');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    lifecycleRef.current += 1;
    activeUserIdRef.current = null;
    if (!open) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } else {
      setStep('prompt');
      setCapturedImage(null);
    }
    return () => {
      lifecycleRef.current += 1;
      activeUserIdRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (activeUserIdRef.current && session?.user.id !== activeUserIdRef.current) {
        lifecycleRef.current += 1;
        activeUserIdRef.current = null;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        setStep('error');
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const startCamera = useCallback(async () => {
    const lifecycle = ++lifecycleRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 },
      });
      if (lifecycle !== lifecycleRef.current || !open) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStep('camera');
    } catch {
      // A missing camera is not identity verification.
      if (lifecycle === lifecycleRef.current && open) onCancel?.();
    }
  }, [onCancel, open]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = 480;
    canvasRef.current.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 480, 480);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    // Stop stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStep('preview');
  }, []);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const verify = useCallback(async () => {
    if (!capturedImage) return;
    const lifecycle = ++lifecycleRef.current;
    setStep('verifying');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (lifecycle !== lifecycleRef.current || !open) return;
      if (!user) {
        setStep('error');
        return;
      }
      activeUserIdRef.current = user.id;

      const blob = await (await fetch(capturedImage)).blob();
      if (lifecycle !== lifecycleRef.current || !open) return;
      const path = `${user.id}/selfie-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      if (lifecycle !== lifecycleRef.current || !open) return;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.id !== user.id) {
        throw new Error('Account changed during selfie submission');
      }
      if (lifecycle !== lifecycleRef.current || !open) return;

      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (driverError || !driver?.id) throw driverError ?? new Error('Driver profile not found');
      if (lifecycle !== lifecycleRef.current || !open) return;

      const { data: urlData } = supabase.storage.from('driver-documents').getPublicUrl(path);

      const { error: insertError } = await supabase.from('driver_documents').insert({
        driver_id: driver.id,
        document_type: 'personal_photo',
        file_url: urlData.publicUrl,
        status: 'pending',
      });
      if (insertError) throw insertError;

      if (lifecycle !== lifecycleRef.current || !open) return;
      activeUserIdRef.current = null;
      setStep('done');
    } catch (err) {
      console.error('Selfie submission failed:', err);
      if (lifecycle === lifecycleRef.current && open) setStep('error');
    }
  }, [capturedImage, open]);

  const handleClose = () => {
    lifecycleRef.current += 1;
    activeUserIdRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Identity Check
          </DialogTitle>
          <DialogDescription>
            Take a quick selfie before going online to verify your identity.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 pt-3">
          <AnimatePresence mode="wait">
            {step === 'prompt' && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  This helps keep riders safe by confirming the registered driver is behind the wheel.
                </p>
                <Button onClick={startCamera} className="w-full font-bold gap-2">
                  <Camera className="w-4 h-4" />
                  Open Camera
                </Button>
                {onCancel && (
                  <button onClick={handleClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Skip for now
                  </button>
                )}
              </motion.div>
            )}

            {step === 'camera' && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Face guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 rounded-full border-2 border-dashed border-primary/50" />
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button onClick={capture} size="lg" className="w-full font-bold gap-2">
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
              </motion.div>
            )}

            {step === 'preview' && capturedImage && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-full aspect-square rounded-2xl overflow-hidden">
                  <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={retake} className="flex-1 gap-1.5">
                    <RotateCcw className="w-4 h-4" />
                    Retake
                  </Button>
                  <Button onClick={verify} className="flex-1 font-bold gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Confirm
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-10"
              >
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-semibold text-foreground">Uploading your photo…</p>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </motion.div>
                <p className="text-sm font-bold text-foreground">Submitted for review</p>
                <p className="text-xs text-muted-foreground text-center">
                  Your photo is pending review. You can go online only after the server confirms approval.
                </p>
                <Button onClick={onSubmitted} className="w-full font-bold">Close</Button>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-10"
              >
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-sm font-bold text-foreground">Upload failed</p>
                <p className="text-xs text-muted-foreground text-center">
                  Please check your connection and try again.
                </p>
                <Button onClick={verify} className="w-full font-bold gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
