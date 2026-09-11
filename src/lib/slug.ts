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
