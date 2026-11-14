// components/chat/VoiceRecorder.tsx — 🎤 Chat එකේ හඬ පණිවිඩ පටිගත කරන බොත්තම
// 💾 Storage / data ඉතුරු කරන්න: mono, Opus 16 kbps (විනාඩියකට ~120 KB), උපරිම විනාඩි 2.
//    Safari පරණ versions වල Opus නැත්නම් AAC (audio/mp4) — ඒකත් පොඩි bitrate එකකින්.
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send, Trash2 } from "lucide-react";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";

const MAX_SECONDS = 120;
const BITRATE = 16_000;
// 👇 Browser එකට පුළුවන් පොඩිම / හොඳම format එක (පිළිවෙළට)
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4"];

const nowMs = () => Date.now(); // 👈 වෙලාව (event handlers / timers ඇතුළේ විතරයි පාවිච්චි කරන්නේ)
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function VoiceRecorder({ onSend, onActiveChange, disabled = false }: {
  onSend: (blob: Blob, seconds: number) => Promise<boolean>;
  onActiveChange?: (active: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useLang();
  const C = t.chat;
  const { showAlert } = useDialog();
  const [state, setState] = useState<"idle" | "recording" | "sending">("idle");
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendOnStop = useRef(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const raf = useRef<number | null>(null);
  const levelEl = useRef<HTMLSpanElement>(null); // 👈 කතා කරනකොට පොඩි රතු කවය ලොකු වෙනවා (setState නැතුව — ඉක්මනින්)

  const cleanup = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
  };

  // Page එකෙන් ගියොත් microphone එක නවත්වනවා
  useEffect(() => () => {
    sendOnStop.current = false;
    if (rec.current?.state === "recording") rec.current.stop();
    cleanup();
  }, []);

  const setActive = (s: "idle" | "recording" | "sending") => {
    setState(s);
    onActiveChange?.(s !== "idle");
  };

  const start = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return showAlert({ title: C.voiceUnsupported, tone: "error" });
    }
    let s: MediaStream;
    try {
      s = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch {
      return showAlert({ title: C.voiceMicDenied, tone: "error" });
    }
    stream.current = s;
    const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported?.(m));
    let r: MediaRecorder;
    try {
      r = new MediaRecorder(s, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: BITRATE });
    } catch {
      cleanup();
      return showAlert({ title: C.voiceUnsupported, tone: "error" });
    }
    chunks.current = [];
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    r.onstop = async () => {
      const secs = Math.min(MAX_SECONDS, (nowMs() - startedAt.current) / 1000);
      const blob = new Blob(chunks.current, { type: (r.mimeType || mimeType || "audio/webm") });
      cleanup();
      if (!sendOnStop.current) return setActive("idle");
      if (secs < 1 || blob.size < 500) {
        setActive("idle");
        return showAlert({ title: C.voiceTooShort, tone: "error" });
      }
      setActive("sending");
      const ok = await onSend(blob, Math.round(secs));
      setActive("idle");
      if (!ok) showAlert({ title: C.voiceError, tone: "error" });
    };
    rec.current = r;
    sendOnStop.current = false;
    startedAt.current = nowMs();
    setSeconds(0);
    r.start(250);
    setActive("recording");

    timer.current = setInterval(() => {
      const secs = (nowMs() - startedAt.current) / 1000;
      setSeconds(secs);
      if (secs >= MAX_SECONDS) stop(true); // 👈 විනාඩි 2 වුණාම auto යවනවා
    }, 200);

    // 👇 Mic level එක (පොඩි animation එකක්)
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      ctx.createMediaStreamSource(s).connect(an);
      audioCtx.current = ctx;
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        if (levelEl.current) levelEl.current.style.transform = `scale(${1 + Math.min(1.2, peak / 50)})`;
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* level animation එක අත්‍යවශ්‍ය නෑ */ }
  };

  const stop = (send: boolean) => {
    sendOnStop.current = send;
    if (rec.current?.state === "recording") rec.current.stop();
    else { cleanup(); setActive("idle"); }
  };

  if (state === "idle") {
    return (
      <button type="button" onClick={start} disabled={disabled} aria-label={C.voiceRecord} title={C.voiceRecord} className="shrink-0 rounded-full border border-border p-3 text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-50">
        <Mic className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2" role="status" aria-live="polite">
      <button type="button" onClick={() => stop(false)} disabled={state === "sending"} aria-label={C.voiceCancel} title={C.voiceCancel} className="shrink-0 rounded-full border border-border p-3 text-muted-foreground transition hover:border-red-500/50 hover:text-red-500 disabled:opacity-50">
        <Trash2 className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-primary/30 bg-primary/5 px-5 py-3">
        <span className="relative flex h-3 w-3 shrink-0">
          <span ref={levelEl} className="absolute inset-0 rounded-full bg-red-500/40 transition-transform duration-75" />
          <span className="relative h-3 w-3 rounded-full bg-red-500" />
        </span>
        <span className="font-mono text-base font-semibold tabular-nums">{fmt(seconds)}</span>
        <span className="truncate text-sm text-muted-foreground">{state === "sending" ? "…" : C.voiceRecording} <span className="hidden sm:inline">· {C.voiceMax}</span></span>
        <div className="ml-auto hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (seconds / MAX_SECONDS) * 100)}%` }} />
        </div>
      </div>
      <button type="button" onClick={() => stop(true)} disabled={state === "sending"} aria-label={C.voiceSend} title={C.voiceSend} className="shrink-0 rounded-full bg-gradient-to-r from-[#DD2F4F] to-[#F05160] p-3 text-white hover:opacity-90 disabled:opacity-60">
        {state === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </button>
    </div>
  );
}
