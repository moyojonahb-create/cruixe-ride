import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const mocks=vi.hoisted(()=>({post:vi.fn(),error:vi.fn()}));
vi.mock('@/components/driver/DriverLifecycleLayout',()=>({default:({children}:{children:import('react').ReactNode})=><div>{children}</div>}));
vi.mock('@/components/map/LazyMapboxMap',()=>({default:()=> <div aria-label="Live map"/>}));
vi.mock('@/components/driver/DriverMessageSheet',()=>({default:()=>null}));
vi.mock('@/components/ride/SafetySheet',()=>({default:()=>null}));
vi.mock('@/hooks/useRideRealtime',()=>({useRideRealtime:()=>{}}));
vi.mock('@/hooks/useUnreadRideMessages',()=>({useUnreadRideMessages:()=>0}));
vi.mock('@/hooks/useVoiceNavigation',()=>({useVoiceNavigation:()=>({speak:vi.fn(),isSupported:false})}));
vi.mock('@/lib/businessApi',()=>({createNotification:vi.fn().mockResolvedValue({success:true}),submitDispute:vi.fn()}));
vi.mock('@/lib/completeTrip',()=>({completeTrip:vi.fn()}));
vi.mock('@/lib/goBackendClient',()=>({goBackend:{post:mocks.post},GoBackendError:class extends Error{status=500}}));
vi.mock('sonner',()=>({toast:{info:vi.fn(),success:vi.fn(),error:mocks.error}}));
vi.mock('@/lib/supabaseClient',()=>({supabase:{from:()=>({select:()=>({eq:()=>({eq:()=>({order:()=>({limit:()=>({maybeSingle:()=>Promise.resolve({data:null,error:null})})})}),maybeSingle:()=>Promise.resolve({data:{status:'accepted'},error:null})})})})}}));
import FullScreenNavigation from '@/components/driver/FullScreenNavigation';
const trip={id:'ride',user_id:'rider',pickup_address:'Montrose',dropoff_address:'Tower Block',fare:5,status:'accepted',pickup_lat:-20.15,pickup_lon:28.58,dropoff_lat:-20.16,dropoff_lon:28.59,payment_method:'cash',passenger_count:1};
const props={driverCoords:null,userId:'driver',riderPhone:null,onTripUpdate:vi.fn(),onTripComplete:vi.fn(),onExit:vi.fn(),onStartCall:vi.fn(),callStatus:'idle'};
describe('Driver lifecycle status boundaries',()=>{
 beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});mocks.post.mockResolvedValue({});});
 it('navigates locally without inventing an enroute server transition, then confirms real arrival',async()=>{
  render(<MemoryRouter><FullScreenNavigation {...props} activeTrip={trip}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Navigate to pickup'}));expect(mocks.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:"I've arrived"}));
  await waitFor(()=>expect(mocks.post).toHaveBeenCalledWith('/api/rides/ride/status',{status:'arrived',expectedStatus:'accepted'}));
 });
 it('requires the separate onboard confirmation before posting trip start, and blocks duplicate taps',async()=>{
  let finish!:()=>void;mocks.post.mockImplementation(()=>new Promise<void>(resolve=>{finish=resolve;}));
  render(<MemoryRouter><FullScreenNavigation {...props} activeTrip={{...trip,status:'arrived'}}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Passenger onboard · Continue'}));expect(mocks.post).not.toHaveBeenCalled();
  const start=screen.getByRole('button',{name:'Start trip'});fireEvent.click(start);fireEvent.click(start);
  expect(mocks.post).toHaveBeenCalledTimes(1);expect(mocks.post).toHaveBeenCalledWith('/api/rides/ride/status',{status:'in_progress',expectedStatus:'arrived'});
  finish();await waitFor(()=>expect(props.onTripUpdate).toHaveBeenCalledWith(expect.objectContaining({status:'in_progress'})));
 });
 it('keeps the onboard screen retryable after a failed start',async()=>{
  mocks.post.mockRejectedValueOnce(new Error('offline'));
  render(<MemoryRouter><FullScreenNavigation {...props} activeTrip={{...trip,status:'arrived'}}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Passenger onboard · Continue'}));fireEvent.click(screen.getByRole('button',{name:'Start trip'}));
  await waitFor(()=>expect(mocks.error).toHaveBeenCalled());expect(props.onTripUpdate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Start trip'}));await waitFor(()=>expect(mocks.post).toHaveBeenCalledTimes(2));
 });
});
