// lib/site-links.ts
// 🗺️ Site එකේ pages ලැයිස්තුව — footer එකයි /site-map page එකයි දෙකම මේකෙන් (එක තැනකින් වෙනස් කරන්න)
import type { Translation } from "@/lib/i18n";

// members = login වෙලා ඉන්න අයට විතරක් වැඩ කරන page එකක් · guestOnly = login වෙලා ඉන්නකොට footer එකේ පෙන්වන්නේ නෑ (update-59)
export type SiteLink = { href: string; label: string; members?: boolean; guestOnly?: boolean };
export type SiteLinkGroup = { title: string; links: SiteLink[] };

export function siteLinkGroups(t: Translation): SiteLinkGroup[] {
  const F = t.siteFooter;
  return [
    {
      title: F.explore,
      links: [
        { href: "/", label: F.home },
        { href: "/browse", label: F.browse, members: true },
        { href: "/pricing", label: F.pricing },
        { href: "/about", label: F.aboutUs },
      ],
    },
    {
      title: F.account,
      links: [
        { href: "/register", label: F.register, guestOnly: true },
        { href: "/login", label: F.login, guestOnly: true },
        { href: "/profile", label: F.myProfile, members: true },
        { href: "/interests", label: F.interests, members: true },
        { href: "/chat", label: F.messages, members: true },
        { href: "/verify", label: F.verify, members: true },
        { href: "/preferences", label: t.prefs.navLabel, members: true },
        { href: "/invite", label: t.invite.navLabel, members: true },
        { href: "/stories/new", label: t.stories.navLabel, members: true },
        { href: "/forgot-password", label: F.forgot, guestOnly: true },
      ],
    },
    {
      title: F.help,
      links: [
        { href: "/help", label: t.help.navLabel },
        { href: "/safety", label: t.safety.navLabel },
        { href: "/contact", label: F.contact }, // 👈 update-59: අලුත් contact form page එක
        { href: "/privacy", label: F.privacy },
        { href: "/terms", label: F.terms },
        { href: "/site-map", label: F.siteMap },
      ],
    },
  ];
}
