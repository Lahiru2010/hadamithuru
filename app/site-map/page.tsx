// app/site-map/page.tsx — 🗺️ Site map (මිනිසුන්ට + Google ට site එකේ හැම page එකක්ම එක තැනකින්)
"use client";

import Link from "next/link";
import { Lock, Map as MapIcon } from "lucide-react";
import { useLang } from "@/components/providers";
import { siteLinkGroups } from "@/lib/site-links";

export default function SiteMapPage() {
  const { t } = useLang();
  const F = t.siteFooter;
  const groups = siteLinkGroups(t);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MapIcon className="h-7 w-7" /></span>
          <h1 className="text-4xl font-extrabold text-foreground">{F.siteMap}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{F.siteMapSubtitle.replace("{brand}", t.brand)}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {groups.map((g) => (
            <section key={g.title} className="rounded-3xl border border-border bg-background p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">{g.title}</h2>
              <ul className="space-y-3">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="group flex items-center justify-between gap-2 text-base text-muted-foreground transition hover:text-primary">
                      <span className="group-hover:underline group-hover:underline-offset-4">{l.label}</span>
                      {l.members && <span title={F.membersOnly} className="flex items-center gap-1 text-xs text-muted-foreground/80"><Lock className="h-3 w-3" /> {F.membersOnly}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
