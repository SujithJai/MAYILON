import fs from "fs";
import path from "path";

export type EnquiryRecord = {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  subject?: string | null;
  message: string;
  createdAt: string;
};

type GlobalWithEnquiries = typeof globalThis & {
  __mayilonEnquiriesStore?: Map<string, EnquiryRecord>;
  __mayilonEnquiriesLoaded?: boolean;
};

const g = globalThis as GlobalWithEnquiries;
if (!g.__mayilonEnquiriesStore) {
  g.__mayilonEnquiriesStore = new Map<string, EnquiryRecord>();
}

const STORE = g.__mayilonEnquiriesStore;

function getStoreFilePaths(): string[] {
  const paths: string[] = [];
  try {
    const tmpDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
    if (fs.existsSync(tmpDir)) {
      paths.push(path.join(tmpDir, "mayilon-enquiries-store.json"));
    }
  } catch {}

  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    paths.push(path.join(dataDir, "enquiries-store.json"));
  } catch {}

  return paths;
}

function loadEnquiriesFromDisk() {
  if (g.__mayilonEnquiriesLoaded) return;
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
    console.warn("[enquiries-store] Error loading from disk:", err);
  } finally {
    g.__mayilonEnquiriesLoaded = true;
  }
}

function saveEnquiriesToDisk() {
  const list = Array.from(STORE.values());
  const jsonStr = JSON.stringify(list, null, 2);

  const filePaths = getStoreFilePaths();
  for (const filePath of filePaths) {
    try {
      fs.writeFileSync(filePath, jsonStr, "utf-8");
    } catch {}
  }
}

loadEnquiriesFromDisk();

export function saveEnquiryToStore(enquiry: EnquiryRecord): EnquiryRecord {
  loadEnquiriesFromDisk();
  STORE.set(enquiry.id, enquiry);
  saveEnquiriesToDisk();
  return enquiry;
}

export function getAllEnquiriesFromStore(): EnquiryRecord[] {
  loadEnquiriesFromDisk();
  return Array.from(STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
