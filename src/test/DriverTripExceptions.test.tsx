import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ read: vi.fn(), report: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: mocks.read }) }) }) }) }) }) } }));
vi.mock('@/lib/businessApi', () => ({ submitDispute: mocks.report }));
import { cancellationIsByRider, usePickupNoShowReport } from '@/components/driver/driverTripExceptionState';
import { DriverCancelledRideScreen, DriverPickupNoShowScreen } from '@/components/driver/DriverTripExceptionScreens';
const callbacks = () => ({ onBack: vi.fn(), onProfile: vi.fn(), onContact: vi.fn() });
describe('Driver trip exceptions', () => {
  beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); vi.clearAllMocks(); mocks.read.mockResolvedValue({data:null,error:null}); mocks.report.mockResolvedValue({success:true}); });
  afterEach(() => { vi.restoreAllMocks(); });
  it('requires saved matching rider attribution and rejects conflicting driver evidence', () => {
    expect(cancellationIsByRider('rider', {actor_id:'rider'})).toBe(true);
    expect(cancellationIsByRider('rider', {actor_id:'driver',payload:{reason:'Rider cancelled'}})).toBe(false);
    expect(cancellationIsByRider('rider', {actor_id:'rider',payload:{cancelled_by:'driver'}})).toBe(false);
    expect(cancellationIsByRider(null, {actor_id:null})).toBe(false);
    expect(cancellationIsByRider('rider',null)).toBe(false);
  });
  it('shows rider cancellation only after a successful persisted event lookup', async () => {
    mocks.read.mockResolvedValue({data:{actor_id:'rider'},error:null});
    const requests=vi.fn();render(<DriverCancelledRideScreen rideId="ride" riderId="rider" onBack={vi.fn()} onProfile={vi.fn()} onRequests={requests}/>);
    expect(await screen.findByRole('heading',{name:'Rider Cancelled Ride'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Find New Requests'}));expect(requests).toHaveBeenCalledOnce();
  });
  it('keeps missing/inaccessible attribution neutral', async () => {
    mocks.read.mockResolvedValue({data:{actor_id:'rider'},error:{message:'denied'}});
    render(<DriverCancelledRideScreen rideId="ride" riderId="rider" onBack={vi.fn()} onProfile={vi.fn()} onRequests={vi.fn()}/>);
    await screen.findByText('Cancelled · source not confirmed');
    expect(screen.queryByRole('heading',{name:'Rider Cancelled Ride'})).not.toBeInTheDocument();
  });
  it('submits one report without changing trip status or granting a fee', async () => {
    let resolve!:(value:{success:boolean})=>void;mocks.report.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
    render(<DriverPickupNoShowScreen rideId="ride" status="arrived" {...callbacks()}/>);
    const button=screen.getByRole('button',{name:'Report Pickup Issue'});fireEvent.click(button);fireEvent.click(button);
    expect(mocks.report).toHaveBeenCalledTimes(1);
    expect(mocks.report).toHaveBeenCalledWith({ride_id:'ride',reporter_role:'driver',category:'other',description:expect.stringContaining('Pickup no-show')});
    resolve({success:true});await screen.findByRole('status');
    expect(screen.getByRole('status')).toHaveTextContent('trip remains active');
    expect(screen.getByRole('button',{name:'Report Submitted'})).toBeDisabled();
  });
  it('does not show success when the service fails and permits retry', async () => {
    mocks.report.mockResolvedValueOnce({success:false});render(<DriverPickupNoShowScreen rideId="ride" status="arrived" {...callbacks()}/>);
    fireEvent.click(screen.getByRole('button',{name:'Report Pickup Issue'}));await screen.findByRole('alert');expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Report Pickup Issue'}));await screen.findByRole('status');expect(mocks.report).toHaveBeenCalledTimes(2);
  });
  it('retains a confirmed report outside the screen and resets only for a new ride', async () => {
    const { result, rerender } = renderHook(({id}) => usePickupNoShowReport(id), {initialProps:{id:'ride'}});
    await act(async()=>{await result.current.report(true);});
    expect(result.current.reported).toBe(true);
    const view=render(<DriverPickupNoShowScreen rideId="ride" status="arrived" reportModel={result.current} {...callbacks()}/>);
    expect(screen.getByRole('button',{name:'Report Submitted'})).toBeDisabled();
    view.unmount();
    render(<DriverPickupNoShowScreen rideId="ride" status="arrived" reportModel={result.current} {...callbacks()}/>);
    expect(screen.getByRole('button',{name:'Report Submitted'})).toBeDisabled();
    await act(async()=>{await result.current.report(true);});expect(mocks.report).toHaveBeenCalledTimes(1);
    rerender({id:'another'});expect(result.current.reported).toBe(false);
  });
  it('does not report after pickup status changes and keeps contact/wait callbacks real', async () => {
    const actions=callbacks();const {rerender}=render(<DriverPickupNoShowScreen rideId="ride" status="arrived" {...actions}/>);
    fireEvent.click(screen.getByRole('button',{name:'Contact rider'}));expect(actions.onContact).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button',{name:'Keep waiting'}));expect(actions.onBack).toHaveBeenCalledOnce();
    rerender(<DriverPickupNoShowScreen rideId="ride" status="in_progress" {...actions}/>);expect(screen.getByRole('button',{name:'Report Pickup Issue'})).toBeDisabled();
    await waitFor(()=>expect(mocks.report).not.toHaveBeenCalled());
  });
});
