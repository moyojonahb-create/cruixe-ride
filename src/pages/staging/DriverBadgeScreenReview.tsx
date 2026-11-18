import { useState } from 'react';
import DriverBadgeScreens, { type BadgeScreen } from '@/components/driver/DriverBadgeScreens';
export default function DriverBadgeScreenReview() {
  const [screen,setScreen] = useState<BadgeScreen>('progress');
  const [notice,setNotice] = useState('');
  return <><aside className="bg-white p-3 text-sm"><p>Driver badge review · sample activity only</p><label>Screen <select value={screen} onChange={event => setScreen(event.target.value as BadgeScreen)}>{['progress','achievements','requirements'].map(value => <option key={value}>{value}</option>)}</select></label>{notice && <p role="status">{notice}</p>}</aside><DriverBadgeScreens screen={screen} activity={{rides:128,parcels:31,status:'approved'}} onScreen={setScreen} onRetry={() => {}} onProfile={() => setNotice('Profile navigation is available in the signed-in Driver app.')} /></>;
}
