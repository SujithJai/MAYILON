export const IMAGE_POOL = [
  "https://images.pexels.com/photos/29440437/pexels-photo-29440437.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/31210634/pexels-photo-31210634.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/36745051/pexels-photo-36745051.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/5302663/pexels-photo-5302663.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/38128369/pexels-photo-38128369.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/12745603/pexels-photo-12745603.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/31196818/pexels-photo-31196818.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/37125137/pexels-photo-37125137.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/12745602/pexels-photo-12745602.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/31210664/pexels-photo-31210664.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
];

export type SeedCategory = {
  name: string;
  nameTa: string;
  slug: string;
  tagline: string;
  description: string;
  accent: string;
  icon: string;
  imageUrl: string;
};

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: "Sky Shots & Aerial",
    nameTa: "வான வெடி",
    slug: "sky-shots",
    tagline: "Multi-shot aerial repeaters that own the night sky",
    description:
      "Professional grade multi-shot aerial repeaters engineered in Sivakasi. Consistent lift, symmetrical bursts and rich colour payloads for weddings, temple festivals and corporate shows.",
    accent: "#0057FF",
    icon: "rocket",
    imageUrl: IMAGE_POOL[0],
  },
  {
    name: "Rockets",
    nameTa: "ராக்கெட்",
    slug: "rockets",
    tagline: "Whistling ascent, cinematic golden bloom",
    description:
      "Classic Sivakasi rockets with reinforced tubes, stable sticks and high-purity composition for a straight ascent and clean canopy burst.",
    accent: "#FF8C00",
    icon: "flame",
    imageUrl: IMAGE_POOL[1],
  },
  {
    name: "Flower Pots",
    nameTa: "பூச்சட்டி",
    slug: "flower-pots",
    tagline: "Golden fountains for the courtyard",
    description:
      "Slow-burn fountains that throw dense golden and colour sprays. The safest crowd-favourite for family celebrations.",
    accent: "#D4AF37",
    icon: "sparkles",
    imageUrl: IMAGE_POOL[2],
  },
  {
    name: "Ground Chakkar",
    nameTa: "நிலச்சக்கரம்",
    slug: "ground-chakkar",
    tagline: "Spinning discs of light",
    description:
      "Perfectly balanced ground spinners with long spin duration, colour changing flames and low smoke composition.",
    accent: "#00D26A",
    icon: "disc",
    imageUrl: IMAGE_POOL[3],
  },
  {
    name: "Sparklers",
    nameTa: "மத்தாப்பு",
    slug: "sparklers",
    tagline: "The first light of every Deepavali",
    description:
      "Low-smoke, child-safe sparklers in electric, colour and crackling variants. Available in 7cm to 100cm lengths.",
    accent: "#F5D982",
    icon: "wand",
    imageUrl: IMAGE_POOL[4],
  },
  {
    name: "Fancy Novelty",
    nameTa: "ஃபேன்சி",
    slug: "fancy-novelty",
    tagline: "Peacocks, butterflies and photo-flash magic",
    description:
      "Playful novelty items engineered for visual storytelling — peacock fans, butterfly wheels, colour smoke and photo flash.",
    accent: "#FF3131",
    icon: "star",
    imageUrl: IMAGE_POOL[5],
  },
  {
    name: "Single Sound Crackers",
    nameTa: "சரவெடி",
    slug: "single-sound",
    tagline: "Precision decibel, clean report",
    description:
      "PESO-compliant sound crackers with consistent decibel output and reliable fuses across all pack sizes.",
    accent: "#FFFFFF",
    icon: "volume",
    imageUrl: IMAGE_POOL[6],
  },
  {
    name: "Gift Boxes",
    nameTa: "பரிசு பெட்டி",
    slug: "gift-boxes",
    tagline: "Curated festival hampers, ready to gift",
    description:
      "Premium curated assortments packed in luxury boxes — the fastest way to shop a complete festival night.",
    accent: "#D4AF37",
    icon: "gift",
    imageUrl: IMAGE_POOL[7],
  },
  {
    name: "Kids Special",
    nameTa: "குழந்தைகள்",
    slug: "kids-special",
    tagline: "Low sound, high delight",
    description:
      "Curated low-noise, low-smoke items designed for children under adult supervision. Safety-first compositions.",
    accent: "#00D26A",
    icon: "smile",
    imageUrl: IMAGE_POOL[8],
  },
  {
    name: "Wedding & Events",
    nameTa: "திருமண",
    slug: "wedding-events",
    tagline: "Show-grade pyrotechnics for big moments",
    description:
      "Cold pyro, stage fountains, confetti shots and sequenced show packs for weddings, temple events and corporate launches.",
    accent: "#0057FF",
    icon: "crown",
    imageUrl: IMAGE_POOL[9],
  },
];

type SeedProductRow = [name: string, mrp: number, packing: string, pieces: number, flags?: string];

export const SEED_PRODUCTS: Record<string, SeedProductRow[]> = {
  "sky-shots": [
    ["Mayilon Royal 12 Shot", 1800, "1 Piece", 1, "FBP"],
    ["Peacock Fury 30 Shot", 4200, "1 Piece", 1, "FBP"],
    ["Golden Storm 60 Shot", 7800, "1 Piece", 1, "P"],
    ["Midnight Sapphire 25 Shot", 3600, "1 Piece", 1, "N"],
    ["Vel Thunder 100 Shot", 12500, "1 Piece", 1, "PN"],
    ["Silver Comet 15 Shot", 2100, "1 Piece", 1, ""],
    ["Crimson Sky 20 Shot", 2900, "1 Piece", 1, "B"],
  ],
  rockets: [
    ["Mayilon Whistling Rocket", 420, "1 Box (10 Pcs)", 10, "B"],
    ["Golden Tail Rocket Deluxe", 560, "1 Box (10 Pcs)", 10, "F"],
    ["Colour Bloom Rocket", 640, "1 Box (10 Pcs)", 10, ""],
    ["Two Sound Rocket Bomb", 720, "1 Box (10 Pcs)", 10, "B"],
    ["Signal Rocket Premium", 880, "1 Box (10 Pcs)", 10, "N"],
    ["Lakshmi Rocket Classic", 380, "1 Box (10 Pcs)", 10, ""],
  ],
  "flower-pots": [
    ["Deluxe Flower Pot Big", 480, "1 Box (10 Pcs)", 10, "FB"],
    ["Colour Koti Flower Pot", 620, "1 Box (10 Pcs)", 10, ""],
    ["Special Flower Pot Small", 260, "1 Box (10 Pcs)", 10, "B"],
    ["Golden Fountain 4 Inch", 950, "1 Box (5 Pcs)", 5, "P"],
    ["Crackling Flower Pot", 540, "1 Box (10 Pcs)", 10, "N"],
    ["Mega Colour Fountain", 1450, "1 Box (5 Pcs)", 5, "FP"],
  ],
  "ground-chakkar": [
    ["Ground Chakkar Big", 320, "1 Box (10 Pcs)", 10, "B"],
    ["Ground Chakkar Special", 240, "1 Box (10 Pcs)", 10, ""],
    ["Colour Chakkar Deluxe", 460, "1 Box (10 Pcs)", 10, "F"],
    ["Asoka Chakkar Premium", 580, "1 Box (10 Pcs)", 10, "P"],
    ["Zamin Chakkar Jumbo", 780, "1 Box (5 Pcs)", 5, "N"],
  ],
  sparklers: [
    ["7cm Electric Sparklers", 90, "1 Box (10 Pcs)", 10, "B"],
    ["10cm Colour Sparklers", 130, "1 Box (10 Pcs)", 10, ""],
    ["15cm Crackling Sparklers", 190, "1 Box (10 Pcs)", 10, "F"],
    ["30cm Golden Sparklers", 260, "1 Box (10 Pcs)", 10, "B"],
    ["50cm Premium Sparklers", 420, "1 Box (10 Pcs)", 10, "P"],
    ["100cm Giant Sparklers", 890, "1 Box (5 Pcs)", 5, "PN"],
  ],
  "fancy-novelty": [
    ["Peacock Feather Fountain", 690, "1 Box (5 Pcs)", 5, "FP"],
    ["Butterfly Wheel Colour", 340, "1 Box (10 Pcs)", 10, ""],
    ["Photo Flash Magic", 210, "1 Box (10 Pcs)", 10, "B"],
    ["Colour Smoke Sticks", 380, "1 Box (10 Pcs)", 10, "N"],
    ["Magic Pop Confetti", 450, "1 Box (10 Pcs)", 10, ""],
    ["Twinkling Star Wheel", 520, "1 Box (10 Pcs)", 10, "F"],
  ],
  "single-sound": [
    ["2.5 inch Lakshmi Crackers", 280, "1 Box (10 Pcs)", 10, "B"],
    ["4 inch Deluxe Crackers", 420, "1 Box (10 Pcs)", 10, ""],
    ["Classic Bijili 50 Pcs", 190, "1 Packet (50 Pcs)", 50, "B"],
    ["Red Bijili 100 Pcs", 340, "1 Packet (100 Pcs)", 100, ""],
    ["1000 Wala Garland", 1650, "1 Piece", 1, "FP"],
    ["5000 Wala Mega Garland", 6800, "1 Piece", 1, "PN"],
  ],
  "gift-boxes": [
    ["Mayilon Mini Gift Box (25 Items)", 1450, "1 Box", 25, "FB"],
    ["Family Festival Box (45 Items)", 3200, "1 Box", 45, "FBP"],
    ["Royal Deepavali Hamper (75 Items)", 6400, "1 Box", 75, "FP"],
    ["Corporate Luxury Box (100 Items)", 11500, "1 Box", 100, "PN"],
    ["Kids Joy Box (30 Items)", 1850, "1 Box", 30, "B"],
  ],
  "kids-special": [
    ["Baby Chakkar Low Sound", 180, "1 Box (10 Pcs)", 10, "B"],
    ["Pop Pop Snaps", 120, "1 Box (10 Pcs)", 10, ""],
    ["Mini Flower Pot Kids", 220, "1 Box (10 Pcs)", 10, "F"],
    ["Fancy Pencil Sparkler", 160, "1 Box (10 Pcs)", 10, ""],
    ["Cartoon Ground Spinner", 290, "1 Box (10 Pcs)", 10, "N"],
  ],
  "wedding-events": [
    ["Cold Pyro Stage Fountain", 2400, "1 Box (5 Pcs)", 5, "PN"],
    ["Sequenced Show Pack 8 Cue", 18500, "1 Kit", 1, "P"],
    ["Confetti Cannon Gold", 1350, "1 Box (5 Pcs)", 5, "F"],
    ["Wedding Entry Sparkle Wand", 980, "1 Box (10 Pcs)", 10, "B"],
    ["Temple Festival Mega Pack", 24500, "1 Kit", 1, "PN"],
  ],
};

export const SEED_REVIEWS = [
  {
    name: "Karthik Subramanian",
    location: "Chennai, Tamil Nadu",
    rating: 5,
    title: "Factory price, festival quality",
    body: "Ordered a ₹28,000 estimate for our apartment Deepavali. Packing was flawless, dispatch in 2 days and the sky shots were genuinely show-grade. The estimate PDF made approvals easy.",
  },
  {
    name: "Priya Ramesh",
    location: "Coimbatore, Tamil Nadu",
    rating: 5,
    title: "The kids box is brilliant",
    body: "Low sound items actually are low sound. My 6 year old finally enjoyed Deepavali without covering her ears. Will reorder every year.",
  },
  {
    name: "Mohan Reddy",
    location: "Hyderabad, Telangana",
    rating: 5,
    title: "Best dealer pricing I found",
    body: "I run 3 retail outlets. The dealer tier pricing plus transport coordination saved me nearly 18% versus my previous supplier in Sivakasi.",
  },
  {
    name: "Anitha Vasanth",
    location: "Madurai, Tamil Nadu",
    rating: 5,
    title: "Wedding show was cinematic",
    body: "We booked the sequenced show pack for a muhurtham. The team advised on safety distance and the cold pyro looked stunning in the videos.",
  },
  {
    name: "Rajesh Kumar",
    location: "Bengaluru, Karnataka",
    rating: 4,
    title: "Smooth estimate process",
    body: "Submitted estimate at midnight, got a WhatsApp confirmation and a call by 10am. Transparent transport charge — no hidden costs.",
  },
  {
    name: "Fathima Noor",
    location: "Kochi, Kerala",
    rating: 5,
    title: "Genuine Sivakasi stock",
    body: "Everything arrived sealed with batch codes and safety leaflets. This is what factory-direct should feel like.",
  },
];
