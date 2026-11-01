from pathlib import Path
root = Path('nonproduction/approved-ride-ui/src')
def edit(name, pairs):
 p=root/name
 s=p.read_text(encoding='utf-8')
 for a,b in pairs:
  if a not in s: raise ValueError(name+': '+a[:70])
  s=s.replace(a,b,1)
 p.write_text(s,encoding='utf-8')
edit('components/ride/RideView.tsx', [
("import RideHomeGreeting from './RideHomeGreeting';", "import RideHomeGreeting from './RideHomeGreeting';\nimport './approvedRide.css';"),
('className="relative h-[100dvh] w-full overflow-hidden bg-background"','className="approved-ride relative h-[100dvh] w-full overflow-hidden bg-background"'),
('className="absolute left-3 z-40 flex','className="ride-map-control absolute left-3 z-40 flex'),
('className="absolute right-3 z-40 flex flex-col gap-3"','className="ride-map-controls absolute right-3 z-40 flex flex-col gap-3"'),
('className="absolute left-0 right-0 z-50"','className={cn("ride-booking-sheet absolute z-50", showHomeContent && !tierPickerOpen && "ride-booking-sheet--home")}'),
('handleWidth={showHomeContent ? 140 : undefined}','handleWidth={showHomeContent ? 52 : undefined}'),
("maxHeight: showHomeContent ? 'none' : (sheetExpanded ? '60vh' : '38vh'),", "maxHeight: showHomeContent ? 'calc(100dvh - env(safe-area-inset-top) - 150px)' : (sheetExpanded ? '70dvh' : '54dvh'),"),
("          paddingBottom: 'env(safe-area-inset-bottom)',",''),
('className="shrink-0 flex items-center gap-2.5 px-4 pt-2 pb-1"','className="ride-location-row shrink-0 flex items-center justify-between gap-2.5 px-4 pt-2 pb-1"'),
('className="ml-auto inline-flex items-center gap-1.5 shrink-0"','className="ride-area-pill ml-auto inline-flex items-center gap-1.5 shrink-0"'),
('className="flex-1 px-4 pt-1 pb-1.5 space-y-2 min-h-0 overflow-y-auto overscroll-contain"','className="ride-sheet-scroll flex-1 px-4 pt-1 pb-1.5 space-y-2 min-h-0 overflow-y-auto overscroll-contain"'),
('<div className="flex items-center gap-2" style={{ height: 62 }}>','<div className="ride-home-tiles flex items-stretch gap-2">'),
('className="shrink-0 px-4 pb-2 pt-1.5"','className="ride-sheet-actions shrink-0 px-4 pb-2 pt-1.5"'),
('<div className="flex items-center gap-3">\n              <button','<div className="ride-home-actions flex items-center gap-3">\n              <button'),
('className="flex-1 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"','className="ride-schedule flex-1 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"'),
('className="relative flex-1 flex items-center justify-center gap-2 overflow-hidden active:scale-[0.97] transition-transform"','className="ride-start relative flex-1 flex items-center justify-center gap-2 overflow-hidden active:scale-[0.97] transition-transform"')])
edit('components/ride/RideHomeGreeting.tsx',[
("import { motion } from 'framer-motion';","import { motion, useReducedMotion } from 'framer-motion';"),
("import pickMeCarIcon from '@/assets/pickme-car-icon.png';","import pickMeCarIcon from '@/assets/cars/car-search-side.png';"),
('  return (','  const reduceMotion = useReducedMotion();\n  return ('),
('initial={{ opacity: 0, y: 8 }}','initial={reduceMotion ? false : { opacity: 0, y: 8 }}'),
('className="flex-1 min-w-0 flex','className="ride-destination-card flex-1 min-w-0 flex'),
('      onClick={onSearchClick}','      type="button"\n      aria-label="Where to? Search destination"\n      onClick={onSearchClick}')])
edit('components/ride/QuickShortcutsRow.tsx',[
("import { motion } from 'framer-motion';","import { motion, useReducedMotion } from 'framer-motion';"),
('  const { user } = useAuth();','  const reduceMotion = useReducedMotion();\n  const { user } = useAuth();'),
('          key={tile.key}','          type="button"\n          aria-label={tile.fav ? `Go to ${tile.label}` : `Set ${tile.label} address`}\n          key={tile.key}'),
('initial={{ opacity: 0, y: 8 }}','initial={reduceMotion ? false : { opacity: 0, y: 8 }}'),
('className="shrink-0 flex flex-col','className={`ride-shortcut ride-shortcut--${tile.key} shrink-0 flex flex-col'),
('transition-transform disabled:opacity-60"','transition-transform disabled:opacity-60`}')])
edit('components/ride/TownSelectorSheet.tsx',[
('        ref={triggerRef}','        ref={triggerRef}\n        type="button"\n        aria-label={`Select town, currently ${currentTown.name}`}\n        aria-expanded={open}'),
('className="inline-flex items-center gap-1.5','className="ride-town-pill inline-flex items-center gap-1.5'),
('minWidth: Math.max(rect.width, 320)','minWidth: Math.min(Math.max(rect.width, 280), window.innerWidth - 24)'),
('                  <button onClick={() => setOpen(false)}','                  <button aria-label="Close town selector" onClick={() => setOpen(false)}'),
('                    placeholder="Search towns…"','                    aria-label="Search towns"\n                    placeholder="Search towns…"')])
edit('components/ride/RideGlassPanel.tsx',[
("import { glassPanel, RIDE_RED_GRADIENT, RIDE_FONT } from './rideGlass';","import { glassPanel, RIDE_RED_GRADIENT, RIDE_FONT } from './rideGlass';\nimport { useId } from 'react';"),
('  return (',"  const curveId = useId().replace(/:/g, '');\n  const approved = className?.includes('ride-booking-sheet');\n  return ("),
('      {/* Red glow','''      {approved && <svg className="ride-sheet-curve" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={curveId} x2="1" y2="1"><stop stopColor="#ff3434" /><stop offset="1" stopColor="#ed0000" /></linearGradient></defs>
        <path fill={`url(#${curveId})`} d="M0 30V28C0 12 10 0 28 0H372C390 0 400 12 400 28V30H0Z" />
        <path fill="#fff" d="M0 30C0 20 10 14 28 14H109C130 14 133 28 160 28H240C267 28 270 14 291 14H372C390 14 400 20 400 30Z" />
      </svg>}
      {/* Red glow'''),
('          height: 40,',"          display: approved ? 'none' : undefined,\n          height: 40,"),
('style={{ top: -4, width: 64, height: 24 }}','style={{ top: approved ? 0 : -4, width: Math.max(64, handleWidth), height: approved ? 30 : 24 }}'),
('          ...glassPanel,',"          ...glassPanel,\n          ...(approved ? { background: '#fff', backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'none' } : {}),"),
('          marginTop: 16,','          marginTop: approved ? 29 : 16,'),
('          borderTopLeftRadius: 22,','          borderTopLeftRadius: approved ? 0 : 22,'),
('          borderTopRightRadius: 22,','          borderTopRightRadius: approved ? 0 : 22,')])
edit('components/MapboxMap.tsx',[
('el.style.filter = "drop-shadow(0 6px 10px rgba(15,23,42,0.35))";','el.style.filter = src === carTopWhite ? "drop-shadow(0 0 1px #ef0808) drop-shadow(0 1px 2px rgba(239,8,8,.5))" : "drop-shadow(0 3px 5px rgba(15,23,42,.25))";')])
print('Updated approved ride presentation')
