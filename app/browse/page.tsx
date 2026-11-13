// app/browse/page.tsx
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import BrowseClient from "@/components/BrowseClient";
import PublishBanner from "@/components/PublishBanner";

// Signed photo links කොච්චර වෙලාවක් වලංගුද (තත්පර) — පැය 1යි
const PHOTO_LINK_SECONDS = 60 * 60;
// 👀 Login නැති අයට පෙන්නන උපරිම පැතිකඩ ගණන (ඉතුරු ඒවා බලන්න join වෙන්න කියනවා)
const GUEST_LIMIT = 36;

type PhotoTarget = { bucket: "avatars" | "avatars-original"; path: string };

export default async function BrowsePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // 👀 Login නැති අයටත් browse කරන්න පුළුවන් (සීමිත විස්තර — පළමු නම විතරයි, ඡායාරූප blur නීති එහෙමම).
  //    කැමැත්ත යවන්න / සම්පූර්ණ පැතිකඩ බලන්න login ඕනේ (BrowseClient එකේ login popup එක)
  const guest = !user;
  const uid = user?.id ?? "00000000-0000-0000-0000-000000000000";

  // 👇 මට අදාළ active interests (pending + accepted) ටික ගන්නවා
  const { data: myInterests } = guest ? { data: [] as { sender_id: string; receiver_id: string; status: string }[] } : await supabase
    .from("interests")
    .select("sender_id, receiver_id, status")
    .in("status", ["pending", "accepted"])
    .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`);

  // ඒවා වර්ග තුනකට බෙදනවා: accept වුණු අය / මම යවපු අය / මට එවපු අය
  const acceptedUserIds: string[] = [];
  const sentUserIds: string[] = [];
  const receivedUserIds: string[] = [];
  for (const i of myInterests || []) {
    const otherId = i.sender_id === uid ? i.receiver_id : i.sender_id;
    if (i.status === "accepted") acceptedUserIds.push(otherId);
    else if (i.sender_id === uid) sentUserIds.push(otherId);
    else receivedUserIds.push(otherId);
  }

  // 👇 Publish කරපු profiles විතරයි Browse එකේ පේන්නේ, සහ මගේ profile එක publish කරලාද කියලා බලනවා
  const [{ data: allProfiles }, { data: me }] = guest
    ? [
        // 👀 Guest: RLS නිසා service role එකෙන්, අලුත්ම published පැතිකඩ GUEST_LIMIT ගණනක් විතරයි
        await createAdminClient().from("profiles").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(GUEST_LIMIT),
        { data: null },
      ]
    : await Promise.all([
        supabase.from("profiles").select("*").neq("id", uid).eq("is_published", true),
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(), // 👈 partner_prefs එකත් එක්ක (column එක නැතත් කැඩෙන්නේ නෑ)
      ]);

  // 👇 දැනටමත් ගැලපුණු (accept කරපු) අය Browse list එකේ පෙන්නන්නේ නෑ.
  //    පස්සේ Interests page එකෙන් remove කළොත් ඒ අය ආයේ මෙතන පේනවා.
  // 🚫 Block කරපු අය / මාව block කරපු අය පෙන්නන්නේ නෑ (දෙපැත්තටම)
  const { data: blockRows } = guest ? { data: [] as { blocker_id: string; blocked_id: string }[] } : await createAdminClient()
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`);
  const blockedIds = new Set((blockRows ?? []).map((b) => (b.blocker_id === uid ? b.blocked_id : b.blocker_id)));

  const rawProfiles = (allProfiles || []).filter((p) => !acceptedUserIds.includes(p.id) && !blockedIds.has(p.id));

  // 👇 හැම profile එකකටම පේන්න ඕන photo එක (original ද blur ද) මෙතනම තීරණය කරනවා
  const targets = new Map<string, PhotoTarget>();
  for (const p of rawProfiles) {
    const usesNew = !!p.avatar_original_path;
    const blurOn = usesNew ? !!p.avatar_blur_enabled : !!p.blur_photo;
    const canSeeOriginal = !blurOn || acceptedUserIds.includes(p.id);

    if (usesNew) {
      targets.set(
        p.id,
        canSeeOriginal
          ? { bucket: "avatars-original", path: p.avatar_original_path }
          : { bucket: "avatars", path: p.avatar_public_path }
      );
    } else if (p.photo_original_path) {
      targets.set(p.id, {
        bucket: "avatars",
        path: canSeeOriginal ? p.photo_original_path : p.photo_blurred_path,
      });
    }
  }

  // 👇 Bucket එකකට එක request එකකින් හැම photo එකකටම signed links හදනවා.
  //    එතකොට browser එක photos කෙලින්ම Supabase CDN එකෙන් එකවර load කරනවා (ගොඩක් ඉක්මන්).
  const signedUrls = new Map<string, string>();
  const admin = createAdminClient();

  await Promise.all(
    (["avatars", "avatars-original"] as const).map(async (bucket) => {
      const paths = [...targets.values()]
        .filter((t) => t.bucket === bucket && t.path)
        .map((t) => t.path);
      if (paths.length === 0) return;

      const { data } = await admin.storage.from(bucket).createSignedUrls(paths, PHOTO_LINK_SECONDS);
      for (const item of data || []) {
        if (item.signedUrl && item.path) signedUrls.set(`${bucket}/${item.path}`, item.signedUrl);
      }
    })
  );

  // 👇 හැම profile එකකම අමතර photos ගණන (popup එකේ photos කොටස ඒ ගමන්ම පෙන්නන්න)
  const photoCounts = new Map<string, number>();
  if (rawProfiles.length > 0) {
    const { data: photoRows } = await createAdminClient()
      .from("profile_photos")
      .select("user_id")
      .in("user_id", rawProfiles.map((p) => p.id));
    for (const r of photoRows ?? []) photoCounts.set(r.user_id, (photoCounts.get(r.user_id) ?? 0) + 1);
  }

  // Private fields browser එකට යවන්නේ නෑ
  const memberProfiles = rawProfiles.map(
    ({
      photo_original_path,
      photo_blurred_path,
      avatar_original_path,
      avatar_public_path,
      email,
      ...rest
    }) => {
      const target = targets.get(rest.id);
      const signed = target ? signedUrls.get(`${target.bucket}/${target.path}`) : undefined;
      return {
        ...rest,
        // Signed link එකක් හැදුණොත් ඒක, නැත්නම් පරණ avatar_url එක (/api/avatar/... route එක)
        avatar_url: signed ?? rest.avatar_url,
        photo_count: photoCounts.get(rest.id) ?? 0,
      };
    }
  );

  // 👀 Guest ලට අවම විස්තර විතරයි (පළමු නම, වයස, දිස්ත්‍රික්කය, photo — blur නීති අනුව)
  const profiles = guest
    ? memberProfiles.map((p) => ({
        id: p.id,
        full_name: String(p.full_name ?? "").trim().split(/\s+/)[0] ?? "",
        age: p.age, gender: p.gender, district: p.district, city: p.city, country: p.country,
        religion: p.religion, mother_tongue: p.mother_tongue, education: p.education, civil_status: p.civil_status,
        height: p.height, caste: p.caste, job_title: p.job_title, income: p.income,
        food_preference: p.food_preference, drinking: p.drinking, smoking: p.smoking, differently_abled: p.differently_abled,
        account_created_by: p.account_created_by, id_verified: p.id_verified, created_at: p.created_at,
        blur_photo: p.blur_photo, avatar_url: p.avatar_url, avatar_placeholder: p.avatar_placeholder,
        founding_member: p.founding_member, founding_number: p.founding_number, boosted_until: p.boosted_until,
        photo_count: p.photo_count,
      }))
    : memberProfiles;

  return (
    <main className="min-h-screen bg-background">
      {/* 👇 මෙතන තිබ්බ <Navbar /> අයින් කළා */}
      <div className="mx-auto max-w-[1600px] px-4 py-8">
        {/* 👇 Page title එක දැන් BrowseClient එකේ (language එකට අනුව වෙනස් වෙනවා) */}
        {/* 👇 මගේ profile එක තාම publish කරලා නැත්නම් මතක් කරනවා */}
        {!guest && !me?.is_published && <PublishBanner />}
        <BrowseClient 
          initialProfiles={profiles} 
          currentUser={user ?? null} 
          acceptedUserIds={acceptedUserIds} 
          sentUserIds={sentUserIds}
          receivedUserIds={receivedUserIds}
          viewerProfile={me ?? null}
        />
      </div>
    </main>
  );
}
