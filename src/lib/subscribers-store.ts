import fs from "fs";
import path from "path";

export type SubscriberRecord = {
  id: string;
  email: string;
  source: string;
  createdAt: string;
};

type GlobalWithSubscribers = typeof globalThis & {
  __mayilonSubscribersStore?: Map<string, SubscriberRecord>;
  __mayilonSubscribersLoaded?: boolean;
};

const g = globalThis as GlobalWithSubscribers;
if (!g.__mayilonSubscribersStore) {
  g.__mayilonSubscribersStore = new Map<string, SubscriberRecord>();
}

const STORE = g.__mayilonSubscribersStore;

function getStoreFilePaths(): string[] {
  const paths: string[] = [];
  try {
    const tmpDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
    if (fs.existsSync(tmpDir)) {
      paths.push(path.join(tmpDir, "mayilon-subscribers-store.json"));
    }
  } catch {}

  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    paths.push(path.join(dataDir, "subscribers-store.json"));
  } catch {}

  return paths;
}

function loadSubscribersFromDisk() {
  if (g.__mayilonSubscribersLoaded) return;
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
    console.warn("[subscribers-store] Error loading from disk:", err);
  } finally {
    g.__mayilonSubscribersLoaded = true;
  }
}

function saveSubscribersToDisk() {
  const list = Array.from(STORE.values());
  const jsonStr = JSON.stringify(list, null, 2);
  const filePaths = getStoreFilePaths();
  for (const filePath of filePaths) {
    try {
      fs.writeFileSync(filePath, jsonStr, "utf-8");
    } catch {}
  }
}

loadSubscribersFromDisk();

export function saveSubscriberToStore(sub: SubscriberRecord): void {
  loadSubscribersFromDisk();
  // Avoid duplicate email subscriptions
  const existing = Array.from(STORE.values()).find(
    (s) => s.email.toLowerCase() === sub.email.toLowerCase(),
  );
  if (!existing) {
    STORE.set(sub.id, sub);
    saveSubscribersToDisk();
  }
}

export function getAllSubscribersFromStore(): SubscriberRecord[] {
  loadSubscribersFromDisk();
  return Array.from(STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
