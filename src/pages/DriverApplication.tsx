import { useAuth } from '@/hooks/useAuth';
import { useDriverApplication } from '@/hooks/useDriverApplication';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DriverRegistrationWizard from '@/components/driver/DriverRegistrationWizard';
import DocumentUpload from '@/components/driver/DocumentUpload';
import ApplicationStatus from '@/components/driver/ApplicationStatus';
import { Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import AuthModalWrapper from '@/components/auth/AuthModalWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';

const DriverApplication = () => {
  const { user, loading: authLoading } = useAuth();
  const { driverProfile, documentsStatus, isLoading, refetchDriver, hasApplied, error } = useDriverApplication();
  const navigate = useNavigate();
  const documentsSection = useRef<HTMLElement>(null);
  const reviewDocuments = () => {
    documentsSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    documentsSection.current?.focus({ preventScroll: true });
  };
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error && user) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-[440px] flex-col justify-center gap-4 bg-white p-6">
        <h1 className="text-2xl font-bold">Unable to load your application</h1>
        <p role="alert">Your application status could not be checked. Please try again before making changes.</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
        <Link to="/driver" className="text-center underline">Back to Driver</Link>
      </main>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onLoginClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
          onSignupClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
          onFavoritesClick={() => {}}
          onHistoryClick={() => {}}
        />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 rounded-full bg-accent/10 w-fit mb-4">
                <Car className="h-8 w-8 text-accent" />
              </div>
              <CardTitle>Become a CruiXe Driver</CardTitle>
              <CardDescription>Sign in or create an account to start your driver application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}>Create Account</Button>
              <Button variant="outline" className="w-full" onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}>Sign In</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <AuthModalWrapper isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} mode={authMode} onSwitchMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} />
      </div>
    );
  }

  // Existing application: Figma status variants follow actual backend state.
  if (hasApplied && driverProfile) {
    return (
      <main className="min-h-[100dvh] bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[440px]">
          <ApplicationStatus
            onBack={() => navigate('/driver')}
            onReview={reviewDocuments}
            onContinue={() => navigate('/driver')}
            status={driverProfile.status}
            vehicleInfo={{
              make: driverProfile.vehicle_make,
              model: driverProfile.vehicle_model,
              year: driverProfile.vehicle_year,
              plateNumber: driverProfile.plate_number,
              type: driverProfile.vehicle_type,
            }}
            documentsStatus={documentsStatus}
          />
          <section ref={documentsSection} tabIndex={-1} aria-label="Application documents" className="mt-5 rounded-[20px] bg-white px-4 py-5 shadow-sm">
            <h2 className="mb-3 text-[15px] font-semibold text-[#1f2129]">Your documents</h2>
            <DocumentUpload driverId={driverProfile.id} />
          </section>
        </div>
      </main>
    );
  }

  // New application — multi-step wizard
  return (
    <DriverRegistrationWizard onSuccess={refetchDriver} onClose={() => navigate('/')} />
  );
};

export default DriverApplication;
