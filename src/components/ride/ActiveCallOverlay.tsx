import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCallDuration, type CallStatus } from "@/hooks/useAgoraCall";

interface ActiveCallOverlayProps {
  status: CallStatus;
  duration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
  otherUserName?: string;
}

export default function ActiveCallOverlay({
  status,
  duration,
  isMuted,
  isSpeaker,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  otherUserName = "Call",
}: ActiveCallOverlayProps) {
  const statusText =
    status === "ringing"
      ? "Ringing…"
      : status === "connecting"
      ? "Connecting…"
      : status === "connected"
      ? formatCallDuration(duration)
      : status === "ended"
      ? "Call ended"
      : status === "error"
      ? "Call failed"
      : "";

  return (
    <div data-figma-node={status === "connecting" ? "1240:169" : status === "ringing" ? "1240:214" : status === "connected" ? "1240:259" : status === "ended" ? "1240:301" : "1240:329"}
      className="fixed top-0 left-0 right-0 z-[90] border-b-4 border-[#ff000d] bg-[#1f2129] text-white shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#ffd11c]">In-app call</p>
          <p className="mt-1 truncate text-[15px] font-bold">{otherUserName}</p>
          <p className="text-xs opacity-80">{statusText}</p>
        </div>

        <div className="flex items-center gap-2">
          {status === "connected" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full text-white hover:bg-white/15"
                onClick={onToggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
                onClick={onToggleSpeaker}
              >
                {isSpeaker ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          <Button
            size="icon"
            className="h-11 w-11 rounded-full bg-[#ff000d] hover:bg-[#e6000b] text-white"
            onClick={onEndCall}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
