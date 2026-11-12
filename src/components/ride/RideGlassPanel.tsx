import { ReactNode, CSSProperties, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { glassPanel, RIDE_RED, RIDE_FONT } from './rideGlass';

interface RideGlassPanelProps {
  children: ReactNode;
  variant?: 'glass' | 'ribbon';
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
  variant = 'glass',
  onRibbonClick,
  className,
  style,
  handleWidth = 44,
  panelStyle,
}, ref) {
  const solidRibbon = variant === 'ribbon';

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
      {/* Red glow — behind the glass panel, curves with the top corners and
          fades toward the bottom so only a curved sliver shows above/around
          the panel. */}
      {solidRibbon ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[400/65] overflow-hidden">
          <img src="/brand/ride/red-ribbon.svg" alt="" className="absolute inset-x-0 top-0 w-full" />
          <img src="/brand/ride/white-ribbon.svg" alt="" className="absolute inset-x-0 top-[21px] w-full" />
        </div>
      ) : <div
        className="absolute top-0 left-0 right-0 z-0 pointer-events-none"
        style={{
          height: 40,
          background: RIDE_RED,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          WebkitMaskImage: 'linear-gradient(180deg, #000 40%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(180deg, #000 40%, rgba(0,0,0,0) 100%)',
        }}
      />}

      {/* White grab handle — floats on the exposed curve, generous tap target */}
      {onRibbonClick ? <button
        type="button"
        onClick={onRibbonClick}
        aria-label="Toggle sheet"
        className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center active:opacity-90 transition-opacity"
        style={{ top: solidRibbon ? -6 : -16, width: Math.max(64, handleWidth), height: 44 }}
      >
        <span
          className="block rounded-full"
          style={{ position: 'absolute', top: 21.5, width: handleWidth, height: 5, background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,.18)' }}
        />
      </button> : (
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 z-20 h-[5px] -translate-x-1/2 rounded-full bg-white"
          style={{ top: solidRibbon ? 15.5 : 5.5, width: handleWidth }} />
      )}

      {/* Frosted glass panel — sits in front of the red glow, offset down so
          the glow's curved top edge peeks out from behind it. */}
      <div
        className={cn('relative flex-1 min-h-0 flex flex-col overflow-hidden', solidRibbon ? 'z-0' : 'z-10')}
        style={{
          ...(solidRibbon ? { background: '#fff' } : glassPanel),
          ...panelStyle,
          // The exported ribbon is 400 × 65. Percentage margins follow sheet
          // width, so the content starts below its full curve at every size.
          marginTop: solidRibbon ? '16.25%' : 16,
          borderTopLeftRadius: solidRibbon ? 0 : 22,
          borderTopRightRadius: solidRibbon ? 0 : 22,
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default RideGlassPanel;
