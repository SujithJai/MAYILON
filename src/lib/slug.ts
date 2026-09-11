export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const SITE = {
  name: "Mayilon Crackers",
  tagline: "ஒவ்வொரு வெடியிலும் மகிழ்ச்சி!",
  taglineEn: "Joy in every burst",
  phone: "+91 70101 16061 / +91 99949 48674 / +91 97865 10405",
  phones: ["+91 70101 16061", "+91 99949 48674", "+91 97865 10405"],
  phoneRaw: "917010116061",
  whatsapp: "917010116061",
  email: "sales@mayiloncrackers.com",
  address: "4/95, Pachayaman Kovil Street, Naranapuram, Sivakasi - 626189, Virudhunagar District, Tamil Nadu",
  url: "https://mayiloncrackers.com",
  gst: "",
  license: "PESO / Sivakasi",
};

export function waLink(text: string) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function resolveCategorySlug(categoryName?: string | null): string {
  if (!categoryName) return "single-sound";
  const norm = categoryName.trim().toLowerCase();

  if (norm === "single-sound" || (norm.includes("sound") && (norm.includes("1") || norm.includes("2") || norm.includes("one") || norm.includes("two")))) {
    return "single-sound";
  }
  if (norm === "bijili-crackers" || norm.includes("bijili")) return "bijili-crackers";
  if (norm === "sound-crackers" || norm.includes("wala") || norm === "sound crackers") return "sound-crackers";
  if (norm === "ground-chakkar" || norm.includes("chakkar") || norm.includes("wheel")) return "ground-chakkar";
  if (norm === "twinkling-star" || norm.includes("twinkl") || norm.includes("star")) return "twinkling-star";
  if (norm === "flower-pots" || norm.includes("flower") || norm.includes("pot")) return "flower-pots";
  if (norm === "candles" || norm.includes("pencil") || norm.includes("candle")) return "candles";
  if (norm === "rockets" || norm.includes("rocket")) return "rockets";
  if (norm === "bombs" || norm.includes("bomb")) return "bombs";
  if (norm === "kids-special" || norm.includes("kid")) return "kids-special";
  if (norm === "sky-shots" || norm.includes("aerial") || norm.includes("sky")) return "sky-shots";
  if (norm === "multi-shots" || norm.includes("multi")) return "multi-shots";
  if (norm === "premium-fountains" || (norm.includes("premium") && norm.includes("fountain"))) return "premium-fountains";
  if (norm === "fountains" || norm.includes("fountain")) return "fountains";
  if (norm === "sparklers" || norm.includes("sparkler") || norm.includes("mathappu")) return "sparklers";
  if (norm === "novelties" || norm.includes("match") || norm.includes("novel")) return "novelties";
  if (norm === "gift-boxes" || norm.includes("gift") || norm.includes("box")) return "gift-boxes";

  return slugify(categoryName);
}
