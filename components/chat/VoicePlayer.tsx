// components/chat/VoicePlayer.tsx — 🎤 Chat එකේ හඬ පණිවිඩයක් වාදනය කරන පොඩි player එක
// Play එක ඔබනකම් audio එක download වෙන්නේ නෑ (data ඉතුරු කරන්න). Speed 1× / 1.5× / 2×.
"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Mic, Pause, Play } from "lucide-react";
import { useLang } from "@/components/providers";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const SPEEDS = [1, 1.5, 2];

// 👇 Message ID එකෙන් හැම වෙලේම එකම "waveform" හැඩය (ඇත්ත waveform එකක් ගණනය නොකර — ඉක්මනින්)
function waveFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < 28; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(0.3 + ((h >>> 16) % 70) / 100);
  }
  return out;
}

export default function VoicePlayer({ msgId, duration, isMe, localUrl }: { msgId: string; duration: number; isMe: boolean; localUrl?: string }) {
  const { t } = useLang();
  const C = t.chat;
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);
  const src = localUrl ?? `/api/chat/voice/${msgId}`;
  const total = Math.max(1, duration || 1);

  const bars = useMemo(() => waveFor(msgId), [msgId]);

  const toggle = async () => {
    const a = audio.current;
    if (!a) return;
    if (playing) return a.pause();
    try {
      a.playbackRate = speed;
      await a.play();
    } catch {
      setFailed(true);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audio.current;
    if (!a) return;
    const r = e.currentTarget.getBoundingClientRect();
    const t2 = ((e.clientX - r.left) / r.width) * total;
    try { a.currentTime = Math.max(0, Math.min(total, t2)); setPos(a.currentTime); } catch { /* තාම load වෙලා නැත්නම් */ }
  };

  const nextSpeed = () => {
    const s = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(s);
    if (audio.current) audio.current.playbackRate = s;
  };

  const progress = Math.min(1, pos / total);

  if (failed) {
    return (
      <a href={src} download className={`flex items-center gap-2 text-sm underline-offset-4 hover:underline ${isMe ? "text-white" : "text-primary"}`}>
        <Download className="h-4 w-4" /> {C.voiceCantPlay}
      </a>
    );
  }

  return (
    <div className="flex w-60 max-w-full items-center gap-2.5 py-0.5" aria-label={C.voiceLabel}>
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPos(0); }}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onError={() => setFailed(true)}
      />
      <button type="button" onClick={toggle} aria-label={playing ? C.voicePause : C.voicePlay} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${isMe ? "bg-white text-[#D52047]" : "bg-primary text-white"}`}>
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
      </button>
      <div className="min-w-0 flex-1">
        <div onClick={seek} className="flex h-7 cursor-pointer items-center gap-[2px]" role="slider" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.round(pos)}>
          {bars.map((b, i) => (
            <span key={i} className={`w-[3px] flex-1 rounded-full transition-colors ${i / bars.length < progress ? (isMe ? "bg-white" : "bg-primary") : isMe ? "bg-white/40" : "bg-muted-foreground/30"}`} style={{ height: `${b * 100}%` }} />
          ))}
        </div>
        <div className={`mt-0.5 flex items-center justify-between text-[11px] ${isMe ? "text-white/85" : "text-muted-foreground"}`}>
          <span className="flex items-center gap-1 tabular-nums"><Mic className="h-3 w-3" /> {fmt(playing || pos > 0 ? pos : total)}</span>
          <button type="button" onClick={nextSpeed} className={`rounded-full px-1.5 font-bold ${isMe ? "bg-white/20" : "bg-muted"}`}>{speed}×</button>
        </div>
      </div>
    </div>
  );
}
