// components/DialogProvider.tsx
// Browser එකේ default confirm() / alert() boxes වෙනුවට site එකේම design එකට ගැලපෙන popup එකක්.
//
// පාවිච්චි කරන විදිහ (ඕනම client component එකක):
//   const { showConfirm, showAlert } = useDialog();
//
//   const ok = await showConfirm({ title: "Delete message?", message: "...", confirmText: "Delete", tone: "danger" });
//   if (!ok) return;
//
//   await showAlert({ title: "Saved!", tone: "success" });
"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";

type Tone = "default" | "danger" | "success" | "error";

export type DialogOptions = {
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
  /** Default icon එක වෙනුවට වෙන icon එකක් පෙන්නන්න ඕන නම් */
  icon?: React.ReactNode;
};

type DialogRequest = DialogOptions & {
  id: number;
  kind: "confirm" | "alert";
  resolve: (result: boolean) => void;
};

type DialogContextType = {
  showConfirm: (options: DialogOptions) => Promise<boolean>;
  showAlert: (options: DialogOptions) => Promise<void>;
};

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

const TONES: Record<Tone, { icon: React.ReactNode; iconBox: string; button: string }> = {
  default: {
    icon: <HelpCircle className="h-7 w-7" />,
    iconBox: "bg-primary/10 text-primary",
    button: "bg-gradient-to-r from-[#D61F55] to-[#B5123F] text-white shadow-lg shadow-primary/20 hover:opacity-90",
  },
  danger: {
    icon: <AlertTriangle className="h-7 w-7" />,
    iconBox: "bg-red-500/10 text-red-500",
    button: "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700",
  },
  success: {
    icon: <CheckCircle2 className="h-7 w-7" />,
    iconBox: "bg-green-500/10 text-green-500",
    button: "bg-gradient-to-r from-[#D61F55] to-[#B5123F] text-white shadow-lg shadow-primary/20 hover:opacity-90",
  },
  error: {
    icon: <XCircle className="h-7 w-7" />,
    iconBox: "bg-red-500/10 text-red-500",
    button: "bg-foreground text-background hover:opacity-90",
  },
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  // Popups කිහිපයක් එකවර ඉල්ලුවොත් එකින් එක පෙන්නනවා
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0] ?? null;
  const nextId = useRef(0);

  const showConfirm = useCallback(
    (options: DialogOptions) =>
      new Promise<boolean>((resolve) =>
        setQueue((q) => [...q, { ...options, id: ++nextId.current, kind: "confirm", resolve }])
      ),
    []
  );

  const showAlert = useCallback(
    (options: DialogOptions) =>
      new Promise<void>((resolve) =>
        setQueue((q) => [...q, { ...options, id: ++nextId.current, kind: "alert", resolve: () => resolve() }])
      ),
    []
  );

  const close = useCallback(
    (result: boolean) => {
      if (!current) return;
      current.resolve(result);
      setQueue((q) => q.slice(1));
    },
    [current]
  );

  return (
    <DialogContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      {current && <DialogView key={current.id} dialog={current} onClose={close} />}
    </DialogContext.Provider>
  );
}

function DialogView({ dialog, onClose }: { dialog: DialogRequest; onClose: (result: boolean) => void }) {
  const tone = TONES[dialog.tone ?? "default"];
  const isConfirm = dialog.kind === "confirm";
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Delete වගේ භයානක දේවලදී වැරදිලාවත් Enter ඔබලා delete නොවෙන්න Cancel button එකට focus කරනවා
    if (isConfirm && dialog.tone === "danger") cancelRef.current?.focus();
    else confirmRef.current?.focus();

    // Popup එක open වෙලා තියෙනකොට පිටිපස්සේ page එක scroll වෙන්නේ නෑ
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(!isConfirm);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [dialog, isConfirm, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-modal-backdrop"
      onClick={() => onClose(!isConfirm)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="site-dialog-title"
        aria-describedby={dialog.message ? "site-dialog-message" : undefined}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 text-center shadow-2xl animate-modal-content"
      >
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${tone.iconBox}`}>
          {dialog.icon ?? tone.icon}
        </div>

        <h2 id="site-dialog-title" className="text-lg font-bold text-foreground">
          {dialog.title}
        </h2>

        {dialog.message && (
          <div id="site-dialog-message" className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {dialog.message}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {isConfirm && (
            <button
              ref={cancelRef}
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {dialog.cancelText ?? "Cancel"}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onClose(true)}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tone.button}`}
          >
            {dialog.confirmText ?? (isConfirm ? "Confirm" : "OK")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
