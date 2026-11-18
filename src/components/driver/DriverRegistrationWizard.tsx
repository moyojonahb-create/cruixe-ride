import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CarLoadingSpinner from '@/components/CarLoadingSpinner';
import DriverCaptureGuide, { type DriverCaptureKind } from '@/components/driver/DriverCaptureGuide';
import { createDriverDocument, upsertDriverApplication } from '@/lib/businessApi';

const TOTAL_STEPS = 7;

const personalSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  surname: z.string().min(2, 'Surname is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female'], { required_error: 'Please select your gender' }),
});

const licenseSchema = z.object({
  licenseNumber: z.string().min(2, 'License number is required'),
  licenseExpiry: z.string().min(1, 'Expiration date is required'),
});

const vehicleSchema = z.object({
  vehicleMake: z.string().min(2, 'Vehicle brand is required'),
  vehicleModel: z.string().min(2, 'Vehicle model is required'),
  vehicleColor: z.string().min(2, 'Vehicle color is required'),
  plateNumber: z.string().min(2, 'Plate number is required'),
  vehicleYear: z.number().min(1990).max(new Date().getFullYear() + 1),
  vehicleType: z.enum(['economy', 'comfort', 'premium', 'suv']),
});

type PersonalData = z.infer<typeof personalSchema>;
type LicenseData = z.infer<typeof licenseSchema>;
type VehicleData = z.infer<typeof vehicleSchema>;

interface DriverRegistrationWizardProps {
  onSuccess: () => void;
  onClose?: () => void;
  /** Read-only staging review: always blocks persistence when supplied. */
  previewStep?: number;
}

interface FileUploadBoxProps {
  label: string;
  file: File | null;
  onSelect: (file: File) => void;
}

export function FileUploadBox({ label, file, onSelect }: FileUploadBoxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <button
        type="button"
        aria-label={`Choose ${label}`}
        onClick={() => ref.current?.click()}
        className="flex h-[86px] w-full min-w-0 items-center justify-center overflow-hidden rounded-[15px] border border-[#e2e6ed] bg-[#f7f8fa] transition-colors hover:border-[#ff000d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff000d]"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : file ? (
          <span className="max-w-full truncate px-2 text-xs">{file.name}</span>
        ) : (
          <Plus className="h-7 w-7 text-[#ff000d]" />
        )}
      </button>
      <span className="max-w-full text-center text-[11px] font-medium leading-4 text-[#667080]">{label}</span>
      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function DriverRegistrationWizard({ onSuccess, onClose, previewStep }: DriverRegistrationWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const preview = previewStep !== undefined;
  const [step, setStep] = useState(() => preview ? Math.max(1, Math.min(7, previewStep)) : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [captureGuide, setCaptureGuide] = useState<DriverCaptureKind | null>(null);

  // File state
  const [personalPhoto, setPersonalPhoto] = useState<File | null>(null);
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [licenseBack, setLicenseBack] = useState<File | null>(null);
  const [idCard, setIdCard] = useState<File | null>(null);
  const [selfieWithId, setSelfieWithId] = useState<File | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [insuranceDoc, setInsuranceDoc] = useState<File | null>(null);

  const personalForm = useForm<PersonalData>({
    resolver: zodResolver(personalSchema),
    defaultValues: { firstName: '', surname: '', dateOfBirth: '', gender: undefined },
  });

  const licenseForm = useForm<LicenseData>({
    resolver: zodResolver(licenseSchema),
    defaultValues: { licenseNumber: '', licenseExpiry: '' },
  });

  const vehicleForm = useForm<VehicleData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleMake: '', vehicleModel: '', vehicleColor: '',
      plateNumber: '', vehicleYear: new Date().getFullYear(), vehicleType: 'economy',
    },
  });

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('driver-documents').upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleNext = async () => {
    if (isNavigating || isSubmitting) return;
    if (preview) { setStep(s => Math.min(s + 1, TOTAL_STEPS)); return; }

    setIsNavigating(true);
    try {
      if (step === 1) {
        const valid = await personalForm.trigger();
        if (!valid) return;
      } else if (step === 3) {
        const valid = await licenseForm.trigger();
        if (!valid) return;
      } else if (step === 4) {
        const valid = await vehicleForm.trigger();
        if (!valid) return;
      } else if (step === TOTAL_STEPS) {
        await handleSubmit();
        return;
      }
      setStep(s => Math.min(s + 1, TOTAL_STEPS));
    } finally {
      setIsNavigating(false);
    }
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (preview || !user) return;
    setIsSubmitting(true);
    setShowProcessing(true);

    try {
      const personal = personalForm.getValues();
      const vehicle = vehicleForm.getValues();

      // Create driver record through Go. Storage uploads remain in Supabase.
      const driver = await upsertDriverApplication({
        profile: { full_name: `${personal.firstName.trim()} ${personal.surname.trim()}`, gender: personal.gender },
        driver: {
        vehicle_type: vehicle.vehicleType,
        vehicle_make: vehicle.vehicleMake,
        vehicle_model: vehicle.vehicleModel,
        vehicle_year: vehicle.vehicleYear,
        vehicle_color: vehicle.vehicleColor,
        plate_number: vehicle.plateNumber,
        gender: personal.gender,
        },
      });
      const driverId = driver.id;
      if (!driverId) throw new Error('Failed to create driver application');

      // Upload documents in parallel
      const uploads: Promise<void>[] = [];

      const uploadDoc = async (file: File | null, docType: string) => {
        if (!file) return;
        const path = await uploadFile(file, docType);
        await createDriverDocument({
          driver_id: driverId, document_type: docType, file_url: path, status: 'pending',
        });
      };

      uploads.push(uploadDoc(licenseFront, 'license'));
      uploads.push(uploadDoc(licenseBack, 'license_back'));
      uploads.push(uploadDoc(idCard, 'id_card'));
      uploads.push(uploadDoc(selfieWithId, 'selfie_with_id'));
      uploads.push(uploadDoc(vehiclePhoto, 'vehicle_photo'));
      uploads.push(uploadDoc(insuranceDoc, 'insurance'));
      uploads.push(uploadDoc(personalPhoto, 'personal_photo'));

      const results = await Promise.allSettled(uploads);
      const failedCount = results.filter(r => r.status === 'rejected').length;
      results.forEach(r => {
        if (r.status === 'rejected') console.error('Driver document upload failed:', r.reason);
      });

      if (failedCount > 0) {
        toast({
          title: 'Application submitted with warnings',
          description: `${failedCount} document(s) failed to upload. Open your application to upload the affected documents again.`,
          variant: 'destructive',
        });
      } else {
        const hasDocuments = [licenseFront, licenseBack, idCard, selfieWithId, vehiclePhoto, insuranceDoc, personalPhoto].some(Boolean);
        toast({ title: 'Application saved', description: hasDocuments ? 'Your documents have been submitted for review.' : 'Open your application to add documents for review.' });
      }
      await queryClient.invalidateQueries({ queryKey: ['driver-profile', user.id] });
      onSuccess();
      if (failedCount > 0) navigate('/driver/application');
    } catch (error: unknown) {
      let errorMessage = 'Failed to submit application.';
      if (error instanceof Error) {
        const errMsg = error.message.toLowerCase();
        if (errMsg.includes('new row violates row-level security') || errMsg.includes('42501')) {
          errorMessage = 'We could not save your application. Please sign in again or contact support.';
        } else if (errMsg.includes('bucket') || errMsg.includes('storage')) {
          errorMessage = 'We could not upload your document. Please try again or contact support.';
        } else if (errMsg.includes('column') || errMsg.includes('does not exist')) {
          errorMessage = 'Registration is temporarily unavailable. Please try again later or contact support.';
        } else {
          errorMessage = 'We could not save your application. Please try again or contact support.';
        }
        console.error('Driver registration error:', error);
      }
      toast({ title: 'Registration Failed', description: errorMessage, variant: 'destructive' });
      setShowProcessing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (captureGuide) {
    return <DriverCaptureGuide kind={captureGuide} onBack={() => setCaptureGuide(null)} />;
  }

  if (showProcessing) {
    return <CarLoadingSpinner message="Checking all the details — you're almost on your way!" onClose={onClose} />;
  }

  const stepDescriptions = [
    "Your personal details and profile photo help riders recognise you.",
    "Upload your identity document and an ID-matching selfie.",
    "We need a valid licence before you can drive.",
    "Tell us which car you will use for trips.",
    "Upload your current vehicle insurance documentation.",
    "Photograph the actual vehicle you drive.",
    "Check your information before you submit it for review.",
  ];
  const stepTitles = [
    "Your profile photo", "Verify your identity", "Driver’s licence",
    "About your vehicle", "Vehicle documents", "Photograph your car", "Review your details",
  ];

  return (
    <div className="min-h-[100dvh] bg-[#fdfdfd] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col bg-white">
        {/* Figma Driver onboarding frame family 1101:105–1101:315.
            Preserve existing form schema, progression, uploads and submission calls. */}
        <header className="relative h-[246px] shrink-0 bg-[#1f2129] px-6 pt-[max(2rem,env(safe-area-inset-top))] text-white">
          <div className="flex items-start justify-between gap-3">
            <button type="button" aria-label={step === 1 ? 'Close registration' : 'Previous registration step'}
              onClick={step === 1 ? onClose : handleBack}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#1f2129] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd11c]">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="rounded-full bg-white px-4 py-3 text-[10px] font-bold tracking-[0.08em] text-[#1f2129]">
              DRIVER CHECK
            </div>
          </div>
          <div className="mt-9">
            <p className="text-[30px] font-bold tracking-tight">CruiXe <span className="text-white">DRIVER</span></p>
            <div className="mt-1 h-1 w-[52px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
          </div>
        </header>

        <div className="relative z-10 -mt-[29px] h-[55px] shrink-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-[46px] rounded-t-[52%] bg-[#ff000d]" />
          <div className="absolute inset-x-0 top-[19px] h-[50px] rounded-t-[52%] bg-white" />
          <div className="absolute left-1/2 top-[13px] h-[5px] w-[54px] -translate-x-1/2 rounded-full bg-white" />
        </div>

        <div className="px-[22px] pb-3">
          <h1 className="text-[24px] font-bold leading-[1.35]">{stepTitles[step - 1]}</h1>
          <p className="mt-1 text-[12px] leading-[18px] text-[#667080]">{stepDescriptions[step - 1]}</p>
          <div className="mt-5 flex items-center gap-2">
            <span className="h-1 w-[34px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">{step === TOTAL_STEPS ? 'FINAL REVIEW' : `DRIVER VERIFICATION · ${step} OF ${TOTAL_STEPS - 1}`}</span>
          </div>
        </div>

      {/* Scrollable content, safe at iPhone XR and 16 Pro widths */}
      <fieldset disabled={preview} className="min-w-0 min-h-0 flex-1 space-y-4 overflow-y-auto px-[20px] py-5">

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Form {...personalForm}>
            <form className="space-y-4">
              <FileUploadBox label="Front-facing selfie" file={personalPhoto} onSelect={setPersonalPhoto} />
              <button type="button" onClick={() => setCaptureGuide('profile')} className="min-h-11 text-left text-[12px] font-semibold text-[#ff000d]">Photo tips · Profile</button>

              <FormField control={personalForm.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="First name" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive text-xs" />
                </FormItem>
              )} />

              <FormField control={personalForm.control} name="surname" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Surname" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive text-xs" />
                </FormItem>
              )} />

              <FormField control={personalForm.control} name="dateOfBirth" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="date" placeholder="Date of birth" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive text-xs" />
                </FormItem>
              )} />

              <FormField control={personalForm.control} name="gender" render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-destructive text-xs" />
                </FormItem>
              )} />
            </form>
          </Form>
        )}

        {/* Step 2: Identity document */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <FileUploadBox label="Official ID document" file={idCard} onSelect={setIdCard} />
              <FileUploadBox label="Selfie with ID" file={selfieWithId} onSelect={setSelfieWithId} />
            </div>
            <button type="button" onClick={() => setCaptureGuide('identity')} className="min-h-11 text-left text-[12px] font-semibold text-[#ff000d]">Photo tips · Identity document</button>
          </div>
        )}

        {/* Step 3: Driver License */}
        {step === 3 && (
          <Form {...licenseForm}>
            <form className="space-y-4">
              <div className="flex gap-4">
                <FileUploadBox label="Driver license" file={licenseFront} onSelect={setLicenseFront} />
                <FileUploadBox label="Back side of license" file={licenseBack} onSelect={setLicenseBack} />
              </div>
              <button type="button" onClick={() => setCaptureGuide('licence')} className="min-h-11 text-left text-[12px] font-semibold text-[#ff000d]">Photo tips · Licence</button>

              <FormField control={licenseForm.control} name="licenseNumber" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="License number" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive text-xs" />
                </FormItem>
              )} />

              <FormField control={licenseForm.control} name="licenseExpiry" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="date" placeholder="Expiration date" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage className="text-destructive text-xs" />
                </FormItem>
              )} />
            </form>
          </Form>
        )}

        {/* Step 4: Vehicle Information */}
        {step === 4 && (
          <Form {...vehicleForm}>
            <form className="space-y-4">
              <FormField control={vehicleForm.control} name="vehicleMake" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Vehicle brand" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={vehicleForm.control} name="vehicleModel" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Vehicle model" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={vehicleForm.control} name="vehicleColor" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Vehicle color" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={vehicleForm.control} name="plateNumber" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Plate number" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={vehicleForm.control} name="vehicleYear" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="number" placeholder="Production year" className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base"
                      {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={vehicleForm.control} name="vehicleType" render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-[50px] rounded-[13px] border-[#e2e6ed] bg-white text-base">
                        <SelectValue placeholder="Vehicle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="comfort">Comfort</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </form>
          </Form>
        )}

        {/* Step 5: Existing insurance upload — preserve the approved document API contract. */}
        {step === 5 && (
          <div className="space-y-4">
            <FileUploadBox label="Vehicle insurance" file={insuranceDoc} onSelect={setInsuranceDoc} />
            <button type="button" onClick={() => setCaptureGuide('documents')} className="min-h-11 text-left text-[12px] font-semibold text-[#ff000d]">Photo tips · Vehicle documents</button>
            <p className="rounded-2xl border border-[#e2e6ed] bg-[#f7f8fa] px-4 py-3 text-[12px] leading-5 text-[#667080]">
              Upload a current insurance disc or cover note. Other vehicle document categories
              will be added once their backend verification requirements are confirmed.
            </p>
          </div>
        )}

        {/* Step 6: Actual vehicle photo, not a sample image. */}
        {step === 6 && (
          <div className="space-y-4">
            <FileUploadBox label="Vehicle photo" file={vehiclePhoto} onSelect={setVehiclePhoto} />
            <button type="button" onClick={() => setCaptureGuide('vehicle')} className="min-h-11 text-left text-[12px] font-semibold text-[#ff000d]">Photo tips · Vehicle</button>
            <p className="rounded-2xl border border-[#e2e6ed] bg-[#f7f8fa] px-4 py-3 text-[12px] leading-5 text-[#667080]">
              Make the number plate and vehicle body clearly visible. Additional front,
              rear and interior photo fields need a matching verified backend contract.
            </p>
          </div>
        )}

        {/* Step 7: Review actual entered data; never imply pending means approved. */}
        {step === 7 && (
          <div className="space-y-3">
            {[
              { label: 'Personal identity', value: [personalForm.getValues('firstName'), personalForm.getValues('surname')].filter(Boolean).join(' ') || 'Not provided' },
              { label: 'Profile and ID photos', value: [personalPhoto && 'Profile', idCard && 'ID', selfieWithId && 'Selfie with ID'].filter(Boolean).join(' · ') || 'No photos selected' },
              { label: 'Driver licence', value: licenseForm.getValues('licenseNumber') || 'Not provided' },
              { label: 'Licence expiry', value: licenseForm.getValues('licenseExpiry') || 'Not provided' },
              { label: 'Vehicle details', value: [vehicleForm.getValues('vehicleMake'), vehicleForm.getValues('vehicleModel'), vehicleForm.getValues('vehicleYear')].filter(Boolean).join(' ') },
              { label: 'Registration plate', value: vehicleForm.getValues('plateNumber') || 'Not provided' },
              { label: 'Vehicle documents', value: [insuranceDoc && 'Insurance', vehiclePhoto && 'Vehicle photo'].filter(Boolean).join(' · ') || 'No vehicle attachments selected' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-[15px] border border-[#e2e6ed] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold text-[#667080]">{label}</p>
                <p className="mt-1 break-words text-[13px] font-semibold text-[#1f2129]">{value}</p>
              </div>
            ))}
            <p className="rounded-[15px] bg-[#f7f8fa] px-4 py-3 text-[11px] leading-5 text-[#667080]">
              Submitting does not approve your account. Our verification team must review the application.
            </p>
          </div>
        )}
      </fieldset>

      {/* Footer with step indicator and nav */}
      <footer className="sticky bottom-0 border-t border-[#e2e6ed] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? 'bg-[#ff000d]' : i === step ? 'bg-[#ffd11c]' : 'bg-[#e2e6ed]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#667080]">{step} of {TOTAL_STEPS}</span>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting || isNavigating}
              className="h-[54px] w-[54px] rounded-[18px] border-[#ff000d] bg-white text-[#ff000d]"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <Button
              onClick={handleNext}
              disabled={isSubmitting || isNavigating}
              className="h-[55px] min-w-[170px] rounded-[18px] bg-[#ff000d] px-6 text-[15px] font-semibold text-white hover:bg-[#eb0010]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {step === TOTAL_STEPS ? (preview ? 'Preview only' : 'Submit') : 'Next'}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
