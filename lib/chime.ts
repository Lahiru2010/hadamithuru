// lib/chime.ts — 🔔 Sound file එකක් නැතුව browser එකේම හදන මෘදු "ding-dong" එකක් (Web Audio)
export function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* Browser එක sound වලට ඉඩ දෙන්නේ නැත්නම් කමක් නෑ */
  }
}

/** Admin dashboard එකේ tab එකක් open කරන්න (වෙන page එකක ඉඳන් ආවත්) */
export function openAdminTab(tab: "verify" | "support" | "reports" | "pricing") {
  sessionStorage.setItem("seneha_admin_tab", tab);
  window.dispatchEvent(new CustomEvent("admin-tab", { detail: tab }));
}
