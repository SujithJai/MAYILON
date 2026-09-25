import fs from "fs";
import path from "path";

export type DealerApplicationRecord = {
  id: string;
  businessName: string;
  contactName: string;
  mobile: string;
  email?: string | null;
  gstNumber?: string | null;
  licenseNumber?: string | null;
  state: string;
  city?: string | null;
  expectedVolume?: string | null;
  tier: "WHOLESALE" | "DISTRIBUTOR" | "SUPER_DEALER";
  status: string;
  createdAt: string;
};

type GlobalWithDealers = typeof globalThis & {
  __mayilonDealersStore?: Map<string, DealerApplicationRecord>;
  __mayilonDealersLoaded?: boolean;
};

const g = globalThis as GlobalWithDealers;
if (!g.__mayilonDealersStore) {
  g.__mayilonDealersStore = new Map<string, DealerApplicationRecord>();
}

const STORE = g.__mayilonDealersStore;

function getStoreFilePaths(): string[] {
  const paths: string[] = [];
  try {
    const tmpDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
    if (fs.existsSync(tmpDir)) {
      paths.push(path.join(tmpDir, "mayilon-dealers-store.json"));
    }
  } catch {}

  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    paths.push(path.join(dataDir, "dealers-store.json"));
  } catch {}

  return paths;
}

function loadDealersFromDisk() {
  if (g.__mayilonDealersLoaded) return;
  try {
    const filePaths = getStoreFilePaths();
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        if (raw.trim()) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            for (const item of list) {
              if (item && item.id) {
                STORE.set(item.id, item);
              }
            }
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[dealers-store] Error loading from disk:", err);
  } finally {
    g.__mayilonDealersLoaded = true;
  }
}

function saveDealersToDisk() {
  const list = Array.from(STORE.values());
  const jsonStr = JSON.stringify(list, null, 2);

  const filePaths = getStoreFilePaths();
  for (const filePath of filePaths) {
    try {
      fs.writeFileSync(filePath, jsonStr, "utf-8");
    } catch {}
  }
}

loadDealersFromDisk();

export function saveDealerToStore(dealer: DealerApplicationRecord): DealerApplicationRecord {
  loadDealersFromDisk();
  STORE.set(dealer.id, dealer);
  saveDealersToDisk();
  return dealer;
}

export function getAllDealersFromStore(): DealerApplicationRecord[] {
  loadDealersFromDisk();
  return Array.from(STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
