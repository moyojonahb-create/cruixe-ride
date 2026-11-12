import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export const useDriverApplication = () => {
  const { user } = useAuth();

  const { data: driverProfile, isLoading: isLoadingDriver, refetch: refetchDriver, error: driverError } = useQuery({
    queryKey: ['driver-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: documents = [], isLoading: isLoadingDocs, error: documentsError } = useQuery({
    queryKey: ['driver-documents', driverProfile?.id],
    queryFn: async () => {
      if (!driverProfile) return [];

      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driverProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!driverProfile,
  });

  // Query results are newest first. Replaced/rejected historical uploads must
  // not override the current submission for the same document type.
  const latestDocuments = documents.filter((document, index) =>
    documents.findIndex((candidate) => candidate.document_type === document.document_type) === index,
  );
  const documentsStatus = {
    total: latestDocuments.length,
    approved: latestDocuments.filter((d) => d.status === 'approved').length,
    pending: latestDocuments.filter((d) => d.status === 'pending').length,
    rejected: latestDocuments.filter((d) => d.status === 'rejected').length,
  };

  return {
    driverProfile,
    documents,
    error: driverError || documentsError,
    documentsStatus,
    isLoading: isLoadingDriver || isLoadingDocs,
    refetchDriver,
    hasApplied: !!driverProfile,
  };
};
