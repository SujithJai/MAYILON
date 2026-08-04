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
  phone: "+91 90470 12345",
  phoneRaw: "919047012345",
  whatsapp: "919047012345",
  email: "sales@mayiloncrackers.com",
  address: "142, Sattur Main Road, Sivakasi, Virudhunagar District, Tamil Nadu 626123",
  url: "https://mayiloncrackers.com",
  gst: "33AABCM1234K1ZQ",
  license: "PESO / E-13579 / Sivakasi",
};

export function waLink(text: string) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}
