import { ReactNode, CSSProperties, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { glassPanel, RIDE_RED_GRADIENT, RIDE_FONT } from './rideGlass';
import { useId } from 'react';

interface RideGlassPanelProps {
  children: ReactNode;
  /** Tapping the ribbon toggles the sheet height. */
  onRibbonClick?: () => void;
  className?: string;
  style?: CSSProperties;
  /** White grab-handle pill width. Defaults to 44px (ride-selection /
   * finding-drivers screens); the idle screen's mockup measures 140px. */
  handleWidth?: number;
  /** Override/extend the frosted panel's own background/blur/shadow — e.g.
   * the schedule-ride modal sheet uses a more opaque fill than the shared
   * glassPanel token. Merged on top of glassPanel, not replacing it. */
  panelStyle?: CSSProperties;
}

/**
 * Frosted glass sheet with the branded red ribbon + white grab handle on top.
 * Shared by the ride-selection sheet and the finding-drivers card so both
 * screens read as one surface.
 *
 * The ribbon is a soft red glow that sits BEHIND the glass panel — it curves
 * with the sheet's rounded top corners and fades out under the panel, rather
 * than a flat bar stacked in front of it. The panel keeps its own white/
 * frosted fill on top, so red never bleeds through the glass.
 */
const RideGlassPanel = forwardRef<HTMLDivElement, RideGlassPanelProps>(function RideGlassPanel({
  children,
  onRibbonClick,
  className,
  style,
  handleWidth = 44,
  panelStyle,
}, ref) {
  const curveId = useId().replace(/:/g, '');
  const approved = className?.includes('ride-booking-sheet');
  return (
    <div
      ref={ref}
      className={cn('relative flex flex-col overflow-visible', className)}
      style={{
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        fontFamily: RIDE_FONT,
        ...style,
      }}
    >
      {approved && <svg className="ride-sheet-curve" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={curveId} x2="1" y2="1"><stop stopColor="#ff3434" /><stop offset="1" stopColor="#ed0000" /></linearGradient></defs>
        <path fill={`url(#${curveId})`} d="M0 30V28C0 12 10 0 28 0H372C390 0 400 12 400 28V30H0Z" />
        <path fill="#fff" d="M0 30C0 20 10 14 28 14H109C130 14 133 28 160 28H240C267 28 270 14 291 14H372C390 14 400 20 400 30Z" />
      </svg>}
      {/* Red glow — behind the glass panel, curves with the top corners and
          fades toward the bottom so only a curved sliver shows above/around
          the panel. */}
      <div
        className="absolute top-0 left-0 right-0 z-0 pointer-events-none"
        style={{
          display: approved ? 'none' : undefined,
          height: 40,
          background: RIDE_RED_GRADIENT,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          WebkitMaskImage: 'linear-gradient(180deg, #000 40%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(180deg, #000 40%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* White grab handle — floats on the exposed curve, generous tap target */}
      <button
        type="button"
        onClick={onRibbonClick}
        aria-label="Toggle sheet"
        className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center active:opacity-90 transition-opacity"
        style={{ top: -16, width: Math.max(64, handleWidth), height: 44 }}
      >
        <span
          className="block rounded-full"
          style={{ position: 'absolute', top: approved ? 28.5 : 21.5, width: handleWidth, height: 5, background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,.18)' }}
        />
      </button>

      {/* Frosted glass panel — sits in front of the red glow, offset down so
          the glow's curved top edge peeks out from behind it. */}
      <div
        className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden"
        style={{
          ...glassPanel,
          ...(approved ? { background: '#fff', backdropFilter: 'none', WebkitBackdropFilter: 'none', boxShadow: 'none' } : {}),
          ...panelStyle,
          marginTop: approved ? 29 : 16,
          borderTopLeftRadius: approved ? 0 : 22,
          borderTopRightRadius: approved ? 0 : 22,
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default RideGlassPanel;
