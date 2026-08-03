// Shared between submit-plot and submit-layout.
// Looks up each amenity name case-insensitively; inserts it (Title Case)
// if it's genuinely new, then links it to the listing via listing_amenities.

export async function attachAmenities(
  supabase: any,
  ownerType: "plot" | "layout",
  ownerId: string,
  names: string[],
) {
  for (const raw of names) {
    const name = titleCase(raw.trim());
    if (!name) continue;

    let { data: existing } = await supabase
      .from("amenities")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (!existing) {
      const { data: created, error } = await supabase
        .from("amenities")
        .insert({ name })
        .select("id")
        .single();
      if (error) return error.message;
      existing = created;
    }

    const { error: linkErr } = await supabase
      .from("listing_amenities")
      .insert({ owner_type: ownerType, owner_id: ownerId, amenity_id: existing!.id });
    if (linkErr && linkErr.code !== "23505") return linkErr.message; // ignore duplicate-link races
  }
  return null;
}

// Used on edit — replaces the full amenity set for a listing instead of
// only ever adding, so removed amenities actually disappear.
export async function syncAmenities(
  supabase: any,
  ownerType: "plot" | "layout",
  ownerId: string,
  names: string[],
) {
  const { error: delErr } = await supabase
    .from("listing_amenities")
    .delete()
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId);
  if (delErr) return delErr.message;
  if (!names.length) return null;
  return attachAmenities(supabase, ownerType, ownerId, names);
}

export function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}
