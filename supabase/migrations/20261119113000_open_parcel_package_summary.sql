CREATE FUNCTION public.open_parcel_package_summary(p_ride_ids uuid[])
RETURNS TABLE (ride_id uuid, package_size text, who_pays text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.ride_id, p.package_size, p.who_pays
  FROM public.ride_parcel_details p
  JOIN public.rides r ON r.id = p.ride_id
  WHERE p.ride_id = ANY(p_ride_ids)
    AND r.vehicle_type = 'parcel'
    AND r.status = 'pending'
    AND r.driver_id IS NULL
    AND COALESCE(r.expires_at, r.created_at + interval '5 minutes') > now()
    AND EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.user_id = auth.uid() AND d.status = 'approved' AND d.is_online
    )
    AND public.can_driver_operate(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.open_parcel_package_summary(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_parcel_package_summary(uuid[]) TO authenticated;
