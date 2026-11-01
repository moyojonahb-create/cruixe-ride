import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RideView from '../src/components/ride/RideView';
import RideMatching from '../src/pages/RideMatching';
import BottomNavBar from '../src/components/BottomNavBar';
import { RiderNavigationProvider } from '../src/components/RiderNavigationProvider';
import { fixtureEvents } from './fixture-services';
import '../src/index.css';
import '../src/components/ride/approvedRide.css';
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
(window as any).__fixtureEvents = fixtureEvents;
function Fixture() {
 const location = useLocation();
 return <><aside style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#222', color: '#fff', fontSize: 9, textAlign: 'center', pointerEvents: 'none' }}>MOCKED / ISOLATED UI - NO LIVE SERVICES</aside><output data-testid="fixture-route" hidden>{location.pathname}{location.search}</output><Routes><Route path="/ride" element={<RideView />} /><Route path="/ride/:rideId/matching" element={<RideMatching />} /><Route path="*" element={<main style={{ padding: '100px 24px' }}><h1>Isolated navigation destination</h1><p>{location.pathname}</p></main>} /></Routes><BottomNavBar persistent /></>;
}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={client}><BrowserRouter><RiderNavigationProvider><Fixture /></RiderNavigationProvider></BrowserRouter></QueryClientProvider>);
