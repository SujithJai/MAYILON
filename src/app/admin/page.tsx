"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronsDown,
  ChevronsUp,
  Clock,
  Edit,
  ExternalLink,
  GripVertical,
  Handshake,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  Package,
  Check,
  FolderTree,
  Plus,
  QrCode,
  Receipt,
  Save,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  Trash2,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";
import { formatINR } from "@/lib/estimate";

type Stats = {
  kpis: {
    pipeline: number;
    estimateCount: number;
    avgValue: number;
    todayCount: number;
    todayValue: number;
    pending: number;
    conversionRate: number;
    products: number;
    dealers: number;
    enquiries: number;
    subscribers: number;
  };
  byStatus: { status: string; count: number; value: number }[];
  topProducts: { name: string; sku: string; units: number; value: number }[];
  lowStock: { name: string; sku: string; stock: number }[];
  recentEstimates: EstimateRow[];
  activity: { id: string; actor: string; action: string; entity: string; createdAt: string }[];
};

type EstimateRow = {
  id: string;
  estimateNumber: string;
  customerName: string;
  mobile: string;
  state: string;
  district?: string;
  city?: string;
  address?: string;
  itemCount: number;
  grandTotal: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  adminNote?: string | null;
};

type ProductItem = {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  mrp: number;
  offerPrice: number;
  packing: string;
  moq: number;
  stock: number;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  videoUrl?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPremium?: boolean;
};

const STATUSES = ["NEW", "PENDING", "PACKAGE READY", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED", "REJECTED"];
const TABS = [
  { k: "dashboard", l: "Dashboard", icon: LayoutDashboard },
  { k: "estimates", l: "Orders & Estimates", icon: Receipt },
  { k: "inventory", l: "Products & Offers", icon: Boxes },
  { k: "categories", l: "Categories", icon: FolderTree },
  { k: "banner", l: "Festive Banner", icon: Sparkles },
  { k: "dealers", l: "Dealers", icon: Handshake },
  { k: "enquiries", l: "Enquiries", icon: Mail },
  { k: "analytics", l: "Analytics", icon: BarChart3 },
] as const;

type TabKey = (typeof TABS)[number]["k"];

const PREFIX_MAP: Record<string, string> = {
  "One Sound / 2 Sound Crackers": "MYL-SND",
  "Bijili Crackers": "MYL-BJL",
  "SOUND CRACKERS": "MYL-SD",
  "Ground Chakkars": "MYL-GCK",
  "Twinkling Stars": "MYL-TWN",
  "Flower Pots": "MYL-FLP",
  "Rockets": "MYL-RKT",
  "Pencils": "MYL-PNC",
  "Bombs": "MYL-BMB",
  "Fountains": "MYL-FTN",
  "KIDS SPECIAL": "MYL-KDS",
  "Aerial Shots": "MYL-SKY",
  "Multi Shots": "MYL-MLT",
  "PREMIUM FOUNTAINS": "MYL-PF",
  "Sparklers": "MYL-SPK",
  "Colour Matches & Novelties": "MYL-NVL",
  "Gift Boxes": "MYL-GFT",
};

const OFFICIAL_CATEGORIES = [
  "One Sound / 2 Sound Crackers",
  "Bijili Crackers",
  "SOUND CRACKERS",
  "Ground Chakkars",
  "Twinkling Stars",
  "Flower Pots",
  "Rockets",
  "Pencils",
  "Bombs",
  "Fountains",
  "KIDS SPECIAL",
  "Aerial Shots",
  "Multi Shots",
  "PREMIUM FOUNTAINS",
  "Sparklers",
  "Colour Matches & Novelties",
  "Gift Boxes",
];

const CATEGORY_ICONS: Record<string, string> = {
  "One Sound / 2 Sound Crackers": "🧨",
  "Bijili Crackers": "⚡",
  "SOUND CRACKERS": "💥",
  "Ground Chakkars": "🌀",
  "Twinkling Stars": "⭐",
  "Flower Pots": "🌸",
  "Rockets": "🚀",
  "Pencils": "✏️",
  "Bombs": "💣",
  "Fountains": "⛲",
  "KIDS SPECIAL": "✨",
  "Aerial Shots": "🎆",
  "Multi Shots": "🎇",
  "PREMIUM FOUNTAINS": "👑",
  "Sparklers": "🪄",
  "Colour Matches & Novelties": "🎁",
  "Gift Boxes": "📦",
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [dealers, setDealers] = useState<Record<string, string>[]>([]);
  const [enquiries, setEnquiries] = useState<Record<string, string>[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [isDraft, setIsDraft] = useState(false);
  const [draftCategories, setDraftCategories] = useState<Set<string>>(new Set());
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [savingWholeWebsite, setSavingWholeWebsite] = useState(false);
  const [draggedProduct, setDraggedProduct] = useState<{ id: string; category: string; index: number } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Product Modal & Inline Edit State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineMrp, setInlineMrp] = useState<number>(0);
  const [inlineOfferPrice, setInlineOfferPrice] = useState<number>(0);
  const [inlineStock, setInlineStock] = useState<number>(100);
  const [savingInline, setSavingInline] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    categoryName: "PREMIUM FOUNTAINS",
    mrp: 500,
    offerPrice: 100,
    packing: "1 BOX (10 PCS)",
    moq: 1,
    stock: 250,
    imageUrl: "",
    imageUrl2: "",
    imageUrl3: "",
    videoUrl: "",
    isNewArrival: false,
    isBestSeller: true,
    isPremium: false,
  });

  // Notification Toast State
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Payment Modal & Lock States
  const [paymentModalOrder, setPaymentModalOrder] = useState<EstimateRow | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [paymentUpdatingId, setPaymentUpdatingId] = useState<string | null>(null);

  // Categories State
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string; slug: string; productCount: number }[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedProductIdsForNewCat, setSelectedProductIdsForNewCat] = useState<string[]>([]);
  const [catSearchFilter, setCatSearchFilter] = useState("");

  // Rename Category State
  const [renamingCat, setRenamingCat] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Assign Products to Category State
  const [assignModalCat, setAssignModalCat] = useState<{ id: string; name: string } | null>(null);
  const [assignProductIds, setAssignProductIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");

  // Festive Banner State
  const [bannerForm, setBannerForm] = useState({
    enabled: true,
    title: "விநாயகர் சதுர்த்தி & தீபாவளி மெகா சலுகை!",
    subtitle: "Sivakasi Direct Factory Fireworks · Flat 80% Off MRP on All Premium Crackers & Gift Boxes",
    badge: "🐘 Vinayagar Chaturthi & Diwali Mega Sale",
    discountText: "80% FLAT DISCOUNT · ALL TAMIL NADU DELIVERY",
    imageUrl: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=1600&q=80",
    buttonText: "Instant Order / Cart",
    buttonLink: "/estimate",
  });
  const [savingBanner, setSavingBanner] = useState(false);

  const liveStats = useMemo(() => {
    let pipeline = 0;
    let todayCount = 0;
    let todayValue = 0;
    let pending = 0;
    let paidCount = 0;
    const byStatusMap = new Map<string, { count: number; value: number }>();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const e of estimates) {
      const val = parseFloat(String(e.grandTotal || "0").replace(/[^0-9.-]+/g, "")) || 0;
      pipeline += val;

      const d = new Date(e.createdAt);
      if (d >= startOfDay) {
        todayCount += 1;
        todayValue += val;
      }

      const st = e.status || "NEW";
      const cur = byStatusMap.get(st) || { count: 0, value: 0 };
      cur.count += 1;
      cur.value += val;
      byStatusMap.set(st, cur);

      if (st === "NEW" || (st as string) === "PENDING" || e.paymentStatus !== "PAID") {
        pending += 1;
      }
      if (e.paymentStatus === "PAID" || st === "PACKAGE READY" || st === "SHIPPED" || st === "DELIVERED") {
        paidCount += 1;
      }
    }

    const count = estimates.length;
    const avgValue = count > 0 ? pipeline / count : 0;
    const conversionRate = count > 0 ? (paidCount / count) * 100 : 0;

    const byStatus = Array.from(byStatusMap.entries()).map(([status, d]) => ({
      status,
      count: d.count,
      value: d.value,
    }));

    return {
      pipeline: stats?.kpis?.pipeline ? Math.max(stats.kpis.pipeline, pipeline) : pipeline,
      estimateCount: stats?.kpis?.estimateCount ? Math.max(stats.kpis.estimateCount, count) : count,
      avgValue: avgValue || (stats?.kpis?.avgValue ?? 0),
      todayCount: Math.max(stats?.kpis?.todayCount ?? 0, todayCount),
      todayValue: Math.max(stats?.kpis?.todayValue ?? 0, todayValue),
      pending: pending || (stats?.kpis?.pending ?? 0),
      conversionRate: conversionRate || (stats?.kpis?.conversionRate ?? 0),
      byStatus: byStatus.length > 0 ? byStatus : (stats?.byStatus ?? []),
      products: products.length || (stats?.kpis?.products ?? 0),
      dealers: dealers.length || (stats?.kpis?.dealers ?? 0),
      enquiries: enquiries.length || (stats?.kpis?.enquiries ?? 0),
      subscribers: stats?.kpis?.subscribers ?? 0,
    };
  }, [estimates, stats, products, dealers, enquiries]);

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = (p?.name || "").toLowerCase();
      const sku = (p?.sku || "").toLowerCase();
      const cat = (p?.categoryName || "").toLowerCase();
      return name.includes(q) || sku.includes(q) || cat.includes(q);
    });
  }, [products, searchQuery]);

  const allCategoryPills = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const p of products) {
      if (!p) continue;
      const cat = p.categoryName || "Special Fireworks";
      countMap.set(cat, (countMap.get(cat) || 0) + 1);
    }
    const pills: { name: string; count: number; icon: string }[] = [];
    for (const cat of OFFICIAL_CATEGORIES) {
      if (countMap.has(cat)) {
        pills.push({ name: cat, count: countMap.get(cat)!, icon: CATEGORY_ICONS[cat] || "🎇" });
        countMap.delete(cat);
      }
    }
    for (const [cat, count] of countMap.entries()) {
      pills.push({ name: cat, count, icon: CATEGORY_ICONS[cat] || "🎇" });
    }
    return pills;
  }, [products]);

  const categoryGroups = useMemo(() => {
    const map = new Map<string, ProductItem[]>();

    for (const p of filteredProducts) {
      if (!p) continue;
      const cat = p.categoryName || "Special Fireworks";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(p);
    }

    const groups: { category: string; icon: string; items: ProductItem[] }[] = [];

    for (const cat of OFFICIAL_CATEGORIES) {
      if (map.has(cat)) {
        const items = map.get(cat)!;
        if (items.length > 0) {
          groups.push({
            category: cat,
            icon: CATEGORY_ICONS[cat] || "🎇",
            items,
          });
          map.delete(cat);
        }
      }
    }

    for (const [cat, items] of map.entries()) {
      if (items.length > 0) {
        groups.push({
          category: cat,
          icon: CATEGORY_ICONS[cat] || "🎇",
          items,
        });
      }
    }

    if (selectedCategoryFilter !== "ALL") {
      return groups.filter(
        (g) => (g.category || "").toLowerCase() === selectedCategoryFilter.toLowerCase(),
      );
    }

    return groups;
  }, [filteredProducts, selectedCategoryFilter]);


  // Re-sequence SKUs within a category according to their current rank (#1 -> 01, #2 -> 02)
  const handleAutoSequenceCategorySkus = (categoryName: string) => {
    const prefix = PREFIX_MAP[categoryName] || "MYL-PRD";
    let rank = 1;
    const updated = products.map((p) => {
      if (p.categoryName?.trim().toLowerCase() === categoryName.trim().toLowerCase()) {
        const cleanSku = `${prefix}-${rank.toString().padStart(2, "0")}`;
        rank += 1;
        return { ...p, sku: cleanSku };
      }
      return p;
    });
    setProducts(updated);
    setIsDraft(true);
    setDraftCategories((prev) => new Set(prev).add(categoryName));
    setNotificationToast(`🔢 Auto-aligned SKUs for "${categoryName}" to match row rank #1..#${rank - 1}! Click "💾 Save Category" to lock.`);
    setTimeout(() => setNotificationToast(null), 4500);
  };

  // Move product within its category (Draft state - pure reorder by unique id, no SKU overwrite yet)
  const handleMoveItemWithinCategory = (categoryName: string, fromIdx: number, toIdx: number) => {
    const catItems = products.filter((p) => p.categoryName?.trim().toLowerCase() === categoryName.trim().toLowerCase());
    if (fromIdx < 0 || fromIdx >= catItems.length || toIdx < 0 || toIdx >= catItems.length || fromIdx === toIdx) return;

    const itemToMove = catItems[fromIdx];
    const newCatItems = [...catItems];
    newCatItems.splice(fromIdx, 1);
    newCatItems.splice(toIdx, 0, itemToMove);

    // Reinsert into products preserving order of this category
    let catItemIdx = 0;
    const newProducts = products.map((p) => {
      if (p.categoryName?.trim().toLowerCase() === categoryName.trim().toLowerCase()) {
        const replacement = newCatItems[catItemIdx];
        catItemIdx += 1;
        return replacement;
      }
      return p;
    });

    setProducts(newProducts);
    setIsDraft(true);
    setDraftCategories((prev) => new Set(prev).add(categoryName));
    setNotificationToast(`🔄 Moved "${itemToMove.name}" to Rank #${toIdx + 1} (Draft). Click "💾 Save Category" to lock.`);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Level 2: Save Category Order & Lock SKUs cleanly
  const handleSaveCategory = async (categoryName: string) => {
    setSavingCategory(categoryName);
    try {
      const prefix = PREFIX_MAP[categoryName] || "MYL-PRD";
      let rank = 1;
      const updatedProducts = products.map((p) => {
        if (p.categoryName?.trim().toLowerCase() === categoryName.trim().toLowerCase()) {
          const cleanSku = `${prefix}-${rank.toString().padStart(2, "0")}`;
          rank += 1;
          return { ...p, sku: cleanSku };
        }
        return p;
      });

      setProducts(updatedProducts);

      // Save locally
      if (typeof window !== "undefined") {
        localStorage.setItem("mayilon_custom_products", JSON.stringify(updatedProducts));
        localStorage.setItem(
          "mayilon_permanent_product_order",
          JSON.stringify(updatedProducts.map((p) => p.id))
        );
      }

      // Save to server
      const catProducts = updatedProducts.filter(
        (p) => p.categoryName?.trim().toLowerCase() === categoryName.trim().toLowerCase()
      );

      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_category",
          categoryName,
          products: catProducts,
          order: updatedProducts.map((p) => p.id),
        }),
      });
      const data = await res.json();

      setDraftCategories((prev) => {
        const next = new Set(prev);
        next.delete(categoryName);
        if (next.size === 0) setIsDraft(false);
        return next;
      });

      setNotificationToast(`💾 Category "${categoryName}" locked & saved! SKUs cleanly aligned (#1..#${rank - 1}).`);
      setTimeout(() => setNotificationToast(null), 4500);
    } catch (err: any) {
      console.warn("Error saving category:", err);
      setNotificationToast(`Saved locally. Server sync pending.`);
    } finally {
      setSavingCategory(null);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (id: string, category: string, index: number) => {
    setDraggedProduct({ id, category, index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetCategory: string, targetIndex: number) => {
    if (!draggedProduct) return;
    if (draggedProduct.category.toLowerCase() === targetCategory.toLowerCase() && draggedProduct.index !== targetIndex) {
      handleMoveItemWithinCategory(targetCategory, draggedProduct.index, targetIndex);
    }
    setDraggedProduct(null);
  };

  // SAVE WHOLE WEBSITE & PUBLISH LIVE
  const handlePublishWholeWebsite = async () => {
    setSavingWholeWebsite(true);
    try {
      // Align all SKUs across all categories before publishing
      let aligned = [...products];
      for (const cat of OFFICIAL_CATEGORIES) {
        const prefix = PREFIX_MAP[cat] || "MYL-PRD";
        let rank = 1;
        aligned = aligned.map((p) => {
          if (p.categoryName?.toLowerCase() === cat.toLowerCase()) {
            const cleanSku = `${prefix}-${rank.toString().padStart(2, "0")}`;
            rank += 1;
            return { ...p, sku: cleanSku };
          }
          return p;
        });
      }
      setProducts(aligned);

      // Save locally
      if (typeof window !== "undefined") {
        localStorage.setItem("mayilon_custom_products", JSON.stringify(aligned));
        localStorage.setItem("mayilon_permanent_product_order", JSON.stringify(aligned.map((p) => p.id)));
      }

      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish_all",
          products: aligned,
          order: aligned.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setIsDraft(false);
        setDraftCategories(new Set());
        setNotificationToast("🎉 WHOLE WEBSITE SAVED & PUBLISHED LIVE! All 122+ products, prices, and orders are now updated for all customers across all devices.");
        setTimeout(() => setNotificationToast(null), 6000);
      } else {
        alert("Server response: " + (data?.message || "Saved locally"));
        setIsDraft(false);
        setDraftCategories(new Set());
      }
    } catch (err: any) {
      console.warn("Publish error:", err);
      alert("Changes saved locally. Note: Server connection pending.");
    } finally {
      setSavingWholeWebsite(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const pRes = await fetch("/api/v1/products?limit=350", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null);
      let list = pRes?.success && Array.isArray(pRes?.data?.items) ? pRes.data.items : [];
      const serverOrder = (pRes?.data?.productOrder || []) as string[];

      // Clear stale pre-122 browser cache
      try {
        if (typeof window !== "undefined") {
          const V_KEY = "mayilon_catalog_v2026_clean_v3";
          if (localStorage.getItem(V_KEY) !== "true") {
            localStorage.removeItem("mayilon_permanent_product_order");
            localStorage.removeItem("mayilon_custom_products");
            localStorage.setItem(V_KEY, "true");
          }
        }
      } catch (err) {}

      if (list.length > 0) {
        setProducts(
          list.map((it: Record<string, unknown>) => ({
            id: String(it.id),
            sku: String(it.sku),
            name: String(it.name),
            categoryName: String(it.categoryName || "Special Fireworks"),
            mrp: Number(it.mrp),
            offerPrice: Number(it.offerPrice),
            packing: String(it.packing || "1 Box"),
            moq: Number(it.moq || 1),
            stock: Number(it.stock || 100),
            imageUrl: String(it.imageUrl || ""),
            imageUrl2: String(it.imageUrl2 || ""),
            imageUrl3: String(it.imageUrl3 || ""),
            videoUrl: String(it.videoUrl || ""),
            isNewArrival: Boolean(it.isNewArrival),
            isBestSeller: Boolean(it.isBestSeller),
            isPremium: Boolean(it.isPremium),
          })),
        );
      }
    } catch (err) {
      console.warn("[Admin load] Error loading products:", err);
    }

    try {
      const s = await fetch("/api/v1/admin/stats").then((r) => r.json()).catch(() => null);
      if (s?.success) setStats(s.data);
    } catch {}

    try {
      const e = await fetch("/api/v1/estimates").then((r) => r.json()).catch(() => null);
      let list = e?.success && Array.isArray(e?.data?.items) ? e.data.items : [];

      try {
        const localRaw = typeof window !== "undefined" ? localStorage.getItem("mayilon_recent_orders") : null;
        if (localRaw) {
          const localOrders = JSON.parse(localRaw);
          if (Array.isArray(localOrders) && localOrders.length > 0) {
            const map = new Map();
            for (const o of list) map.set(o.estimateNumber, o);
            for (const o of localOrders) {
              if (o && o.estimateNumber && !map.has(o.estimateNumber)) {
                map.set(o.estimateNumber, o);
              }
            }
            list = Array.from(map.values());

            // If server had 0 orders but local storage has them, re-sync to serverless backend!
            if ((!e?.data?.items || e.data.items.length === 0) && localOrders.length > 0) {
              void fetch("/api/v1/estimates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "sync_orders", orders: localOrders }),
              });
            }
          }
        }
        if (list.length > 0 && typeof window !== "undefined") {
          localStorage.setItem("mayilon_recent_orders", JSON.stringify(list));
        }
      } catch (localErr) {
        console.warn("[Admin load] Local order backup merge note:", localErr);
      }

      setEstimates(list);
    } catch {}

    try {
      const d = await fetch("/api/v1/dealers").then((r) => r.json()).catch(() => null);
      if (d?.success) setDealers(d.data.items);
    } catch {}

    try {
      const q = await fetch("/api/v1/enquiries").then((r) => r.json()).catch(() => null);
      if (q?.success) setEnquiries(q.data.items);
    } catch {}

    try {
      const c = await fetch("/api/v1/categories").then((r) => r.json()).catch(() => null);
      if (c?.success && Array.isArray(c?.data?.items)) {
        setCategoriesList(c.data.items);
      }
    } catch {}

    try {
      const b = await fetch("/api/v1/admin/banner").then((r) => r.json()).catch(() => null);
      if (b?.success && b?.data) {
        setBannerForm((prev) => ({ ...prev, ...b.data }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/v1/admin/session")
      .then((r) => r.json())
      .then((j) => setAuthed(Boolean(j?.data?.authenticated)));
  }, []);

  useEffect(() => {
    if (!authed) return;
    void load();
    // 5-second live polling for immediate arrival of incoming customer orders
    const pollInterval = setInterval(() => {
      void load();
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [authed, load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanPasscode = passcode.trim();
    if (cleanPasscode === "mayilon-admin") {
      setAuthed(true);
      void fetch("/api/v1/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: cleanPasscode }),
      });
      return;
    }
    const res = await fetch("/api/v1/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: cleanPasscode }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.message);
      return;
    }
    setAuthed(true);
  }

  async function updateStatus(number: string, status: string, customerMobile?: string) {
    if (updatingStatusId) return;
    setUpdatingStatusId(`${number}-${status}`);

    setEstimates((prev) => {
      const next = prev.map((e) => (e.estimateNumber === number ? { ...e, status } : e));
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("mayilon_recent_orders", JSON.stringify(next));
        }
      } catch {}
      return next;
    });

    try {
      await fetch(`/api/v1/estimates/${number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const msg = `📲 Order ${number} updated to [${status}]! Live on Customer Tracking 📦✨`;
      setNotificationToast(msg);
      setTimeout(() => setNotificationToast(null), 4000);
    } catch (err) {
      console.warn("Error updating status:", err);
    } finally {
      setUpdatingStatusId(null);
      void load();
    }
  }

  async function markPaymentReceived(estimateNumber: string, method = "UPI Verification") {
    const existing = estimates.find((e) => e.estimateNumber === estimateNumber);
    if (existing?.paymentStatus === "PAID" || paymentUpdatingId === estimateNumber) return;

    setPaymentUpdatingId(estimateNumber);

    setEstimates((prev) => {
      const next = prev.map((e) =>
        e.estimateNumber === estimateNumber
          ? {
              ...e,
              paymentStatus: "PAID",
              paymentMethod: method,
              status: e.status === "NEW" ? "PAYMENT RECEIVED" : e.status,
            }
          : e,
      );
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("mayilon_recent_orders", JSON.stringify(next));
        }
      } catch {}
      return next;
    });

    try {
      await fetch(`/api/v1/estimates/${estimateNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "PAID",
          paymentMethod: method,
          status: existing?.status === "NEW" ? "PAYMENT RECEIVED" : undefined,
        }),
      });
      setNotificationToast(`🟢 Payment Confirmed for Order ${estimateNumber}! Locked permanently as PAID.`);
      setTimeout(() => setNotificationToast(null), 4000);
    } catch (err) {
      console.warn("[markPaymentReceived] API update note:", err);
    } finally {
      setPaymentUpdatingId(null);
      setPaymentModalOrder(null);
      void load();
    }
  }

  function handleMarkPaid(estimateNumber: string, method: string) {
    void markPaymentReceived(estimateNumber, method);
  }

  async function handleReorder(newProducts: ProductItem[], moveMsg?: string) {
    setProducts(newProducts);
    const newOrderIds = newProducts.map((p) => p.id);

    // 1. Permanent Browser Storage (Survives 100 days!)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("mayilon_permanent_product_order", JSON.stringify(newOrderIds));
      }
    } catch {}

    // 2. Server API Sync
    try {
      await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", order: newOrderIds }),
      });
      if (moveMsg) {
        setNotificationToast(moveMsg);
        setTimeout(() => setNotificationToast(null), 3500);
      }
    } catch (err) {
      console.warn("[handleReorder] Error saving product sequence:", err);
    }
  }

  async function handleSavePermanentSnapshot() {
    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_snapshot" }),
      });
      const json = await res.json();
      const state = json?.data?.state || {
        products,
        productOrder: products.map((p) => p.id),
      };

      const jsonStr = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products-store.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setNotificationToast("💾 Snapshot downloaded! Save in data/products-store.json and git push to lock in for 100 days!");
      setTimeout(() => setNotificationToast(null), 5000);
    } catch (err) {
      console.warn("Snapshot download note:", err);
    }
  }

  function moveProduct(fullIndex: number, direction: "up" | "down" | "top" | "bottom") {
    if (products.length <= 1) return;
    const newProducts = [...products];
    let targetIndex = fullIndex;

    if (direction === "top") {
      targetIndex = 0;
    } else if (direction === "bottom") {
      targetIndex = newProducts.length - 1;
    } else if (direction === "up") {
      targetIndex = Math.max(0, fullIndex - 1);
    } else if (direction === "down") {
      targetIndex = Math.min(newProducts.length - 1, fullIndex + 1);
    }

    if (targetIndex === fullIndex) return;

    const [moved] = newProducts.splice(fullIndex, 1);
    newProducts.splice(targetIndex, 0, moved);

    void handleReorder(
      newProducts,
      `↕️ Position updated: "${moved.name}" is now #${targetIndex + 1} (Live on Storefront)`,
    );
  }

  async function handleQuickSaveInline(p: ProductItem) {
    setSavingInline(true);
    const mrp = Number(inlineMrp) || Number(p.mrp) || 100;
    const offerPrice = Number(inlineOfferPrice) || Number(p.offerPrice) || mrp;
    const stock = Number(inlineStock) || Number(p.stock) || 100;

    const updatedItem: ProductItem = {
      ...p,
      mrp,
      offerPrice,
      stock,
    };
    const updatedList = products.map((it) => (it.id === p.id ? updatedItem : it));
    setProducts(updatedList);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("mayilon_custom_products", JSON.stringify(updatedList));
      }
    } catch {}

    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedItem,
          discountPercent: Math.round(((mrp - offerPrice) / mrp) * 100),
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setNotificationToast(`⚡ Updated ${p.name}: Offer ₹${offerPrice} (Live on Website)!`);
        setTimeout(() => setNotificationToast(null), 3500);
      } else {
        alert("Warning: " + (json?.message || "Could not save to server"));
      }
    } catch (err: any) {
      console.warn("Inline save note:", err);
    } finally {
      setSavingInline(false);
      setInlineEditingId(null);
      await load();
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSavingProduct(true);
    const mrpNum = Number(productForm.mrp) || 100;
    const offerNum = Number(productForm.offerPrice) || mrpNum;

    const prodPayload = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      ...productForm,
      mrp: mrpNum,
      offerPrice: offerNum,
      discountPercent: Math.round(((mrpNum - offerNum) / mrpNum) * 100),
    };

    let updatedProducts: ProductItem[];
    if (editingProduct) {
      updatedProducts = products.map((p) =>
        p.id === editingProduct.id ? prodPayload : p
      );
    } else {
      // Find the last index of products belonging to this category
      let lastIndex = -1;
      for (let i = products.length - 1; i >= 0; i--) {
        if (products[i].categoryName?.toLowerCase() === prodPayload.categoryName?.toLowerCase()) {
          lastIndex = i;
          break;
        }
      }
      if (lastIndex >= 0) {
        updatedProducts = [
          ...products.slice(0, lastIndex + 1),
          prodPayload,
          ...products.slice(lastIndex + 1),
        ];
      } else {
        updatedProducts = [...products, prodPayload];
      }
    }
    setIsDraft(true);

    setProducts(updatedProducts);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("mayilon_custom_products", JSON.stringify(updatedProducts));
      }
    } catch {}

    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prodPayload),
      });
      const data = await res.json();
      if (!data?.success) {
        alert("Warning: " + (data?.message || "Failed to save product"));
      } else {
        setNotificationToast(`⚡ Product "${productForm.name}" saved! Changes live on website.`);
        setTimeout(() => setNotificationToast(null), 4000);
      }
    } catch (apiErr: any) {
      console.warn("[handleSaveProduct] API post error:", apiErr);
      setNotificationToast(`Product "${productForm.name}" updated locally!`);
      setTimeout(() => setNotificationToast(null), 4000);
    } finally {
      setSavingProduct(false);
      setProductModalOpen(false);
      setEditingProduct(null);
      await load();
    }
  }

  async function handleClearAllProducts() {
    if (!confirm("Are you sure you want to remove ALL products and start fresh from scratch?")) return;
    setProducts([]);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mayilon_custom_products");
      }
    } catch {}
    try {
      await fetch("/api/v1/products?action=clear-all", { method: "DELETE" });
    } catch (err) {}
    setNotificationToast("🧹 All catalogue products cleared! Ready for your fresh product uploads.");
    setTimeout(() => setNotificationToast(null), 4000);
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Delete this product from catalogue?")) return;
    const remaining = products.filter((p) => p.id !== id);
    setProducts(remaining);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("mayilon_custom_products", JSON.stringify(remaining));
      }
    } catch {}
    try {
      await fetch(`/api/v1/products?id=${id}`, { method: "DELETE" });
    } catch (err) {}
    setNotificationToast("🗑️ Product deleted from catalogue.");
    setTimeout(() => setNotificationToast(null), 3000);
  }

  function openEditProduct(p: ProductItem) {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      categoryName: p.categoryName,
      mrp: p.mrp,
      offerPrice: p.offerPrice,
      packing: p.packing,
      moq: p.moq,
      stock: p.stock,
      imageUrl: p.imageUrl || "",
      imageUrl2: p.imageUrl2 || "",
      imageUrl3: p.imageUrl3 || "",
      videoUrl: p.videoUrl || "",
      isNewArrival: Boolean(p.isNewArrival),
      isBestSeller: Boolean(p.isBestSeller),
      isPremium: Boolean(p.isPremium),
    });
    setProductModalOpen(true);
  }

  function openAddProduct() {
    setEditingProduct(null);
    const cat = selectedCategoryFilter !== "ALL" ? selectedCategoryFilter : "One Sound / 2 Sound Crackers";
    const catItems = products.filter((p) => p.categoryName?.toLowerCase() === cat.toLowerCase());
    const prefix = PREFIX_MAP[cat] || "MYL-PRD";
    const nextSku = `${prefix}-${(catItems.length + 1).toString().padStart(2, "0")}`;

    setProductForm({
      name: "",
      sku: nextSku,
      categoryName: cat,
      mrp: 500,
      offerPrice: 100,
      packing: "1 Box",
      moq: 1,
      stock: 250,
      imageUrl: "",
      imageUrl2: "",
      imageUrl3: "",
      videoUrl: "",
      isNewArrival: true,
      isBestSeller: false,
      isPremium: false,
    });
    setProductModalOpen(true);
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/v1/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          productIds: selectedProductIdsForNewCat,
        }),
      }).then((r) => r.json());

      if (res?.success) {
        setNotificationToast(`Category "${newCategoryName.trim().toUpperCase()}" created successfully!`);
        setCategoryModalOpen(false);
        setNewCategoryName("");
        setSelectedProductIdsForNewCat([]);
        load();
      } else {
        alert(res?.error || "Failed to create category");
      }
    } catch (e: any) {
      alert(e?.message || "Error creating category");
    }
  }

  async function handleRenameCategory() {
    if (!renamingCat || !renameValue.trim()) return;
    try {
      const res = await fetch("/api/v1/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: renamingCat.id,
          oldName: renamingCat.name,
          name: renameValue.trim(),
        }),
      }).then((r) => r.json());

      if (res?.success) {
        setNotificationToast(`Category renamed to "${renameValue.trim().toUpperCase()}"!`);
        setRenamingCat(null);
        load();
      } else {
        alert(res?.error || "Failed to rename category");
      }
    } catch (e: any) {
      alert(e?.message || "Error renaming category");
    }
  }

  async function handleSaveAssignedProducts() {
    if (!assignModalCat) return;
    try {
      const res = await fetch("/api/v1/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assignModalCat.id,
          name: assignModalCat.name,
          productIds: assignProductIds,
        }),
      }).then((r) => r.json());

      if (res?.success) {
        setNotificationToast(`Updated products in "${assignModalCat.name}"!`);
        setAssignModalCat(null);
        load();
      } else {
        alert(res?.error || "Failed to assign products");
      }
    } catch (e: any) {
      alert(e?.message || "Error assigning products");
    }
  }

  async function handleSaveBanner() {
    setSavingBanner(true);
    try {
      const res = await fetch("/api/v1/admin/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerForm),
      }).then((r) => r.json());

      if (res?.success) {
        setNotificationToast("Festival Offer Banner saved and live on homepage!");
      } else {
        alert(res?.error || "Failed to save banner");
      }
    } catch (e: any) {
      alert(e?.message || "Error saving banner");
    } finally {
      setSavingBanner(false);
    }
  }

  if (authed === null) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500 font-bold">
        Loading Mayilon Admin Console…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass w-full max-w-md rounded-[32px] border border-red-500/20 bg-white p-10 shadow-2xl"
        >
          <LogoLockup size={48} />
          <h1 className="mt-7 font-display text-2xl font-bold text-slate-900">Mayilon Admin Portal</h1>
          <p className="mt-2 text-[13.5px] font-medium text-slate-600">
            Secure admin access for order management, stock updates & payment verification.
          </p>
          <label className="mt-7 block text-[11px] font-bold uppercase tracking-[2px] text-slate-700">
            Admin Passcode
          </label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="field mt-2 !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600"
            placeholder="Enter admin passcode"
          />
          {error && <p className="mt-3 text-[12.5px] font-bold text-red-600">{error}</p>}
          <button type="submit" className="btn-gold mt-6 w-full py-3.5 text-sm uppercase font-bold">
            Sign In to Dashboard
          </button>
          <p className="mt-5 text-[11.5px] font-medium text-slate-500">
            Passcode: <span className="font-bold text-red-600">mayilon-admin</span>
          </p>
          <Link href="/" className="mt-5 block text-center text-[12px] font-bold text-slate-500 hover:text-red-600">
            ← Back to Storefront
          </Link>
        </motion.form>
      </div>
    );
  }

  const k = liveStats;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Toast Notification Alert */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-5 left-1/2 z-[1000] -translate-x-1/2 rounded-2xl border border-red-500/30 bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-2xl flex items-center gap-3"
          >
            <Send size={18} className="text-amber-400" />
            {notificationToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="glass-dark sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-red-500/15 bg-white p-6 shadow-md lg:flex">
        <LogoLockup size={40} />
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600">
          ADMIN CONSOLE v2.0
        </div>

        <nav className="mt-8 flex-1 space-y-2">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13.5px] font-bold transition-all duration-300 ${
                tab === t.k
                  ? "bg-red-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <t.icon size={18} /> {t.l}
            </button>
          ))}
        </nav>

        <Link href="/" className="mb-3 text-[12.5px] font-bold text-slate-500 hover:text-red-600">
          ← View Storefront
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/v1/admin/session", { method: "DELETE" });
            setAuthed(false);
          }}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12.5px] font-bold text-slate-700 hover:border-red-500 hover:text-red-600"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 p-4 sm:p-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-bold capitalize text-slate-900 sm:text-[32px]">{tab}</h1>
            <p className="text-[12.5px] font-medium text-slate-500">
              Mayilon Crackers Operations · Live Inventory, Orders & Payment Processing
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-600 px-4 py-2.5 text-[12.5px] font-bold text-white shadow-md transition hover:bg-red-700"
            >
              <ShoppingBag size={16} /> View Storefront ↗
            </Link>
            <div className="glass hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-4 py-2 text-[12px] font-bold text-emerald-700 shadow-sm sm:flex">
              <ShieldCheck size={16} /> SUPER_ADMIN Active
            </div>
            <button
              onClick={async () => {
                await fetch("/api/v1/admin/session", { method: "DELETE" });
                setAuthed(false);
              }}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-600 hover:text-red-600 lg:hidden"
            >
              <LogOut size={15} /> Exit
            </button>
          </div>
        </header>

        {/* Mobile Navigation Tabs & Storefront Button */}
        <div className="mb-6 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar lg:hidden pb-1">
          <div className="flex items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold ${
                  tab === t.k
                    ? "bg-red-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-50 px-4 py-2 text-[12px] font-bold text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white"
          >
            <ShoppingBag size={14} /> Storefront ↗
          </Link>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Dashboard Tab */}
            {tab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Kpi label="Total Pipeline" value={formatINR(k?.pipeline ?? 0, { compact: true })} sub={`${k?.estimateCount ?? 0} total orders`} icon={BarChart3} />
                  <Kpi label="Today Sales" value={`${k?.todayCount ?? 0}`} sub={formatINR(k?.todayValue ?? 0)} icon={Activity} />
                  <Kpi label="Pending Review" value={`${k?.pending ?? 0}`} sub="Awaiting packing/dispatch" icon={Receipt} accent="#EA580C" />
                  <Kpi label="Conversion Rate" value={`${(k?.conversionRate ?? 0).toFixed(1)}%`} sub={`Avg ${formatINR(k?.avgValue ?? 0)}`} icon={CheckCircle2} accent="#16A34A" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Mini label="Products Live" value={products.length || (k?.products ?? 0)} />
                  <Mini label="Dealer Applications" value={k?.dealers ?? 0} />
                  <Mini label="Enquiries" value={k?.enquiries ?? 0} />
                  <Mini label="Subscribers" value={k?.subscribers ?? 0} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel title="Pipeline Status Breakdown">
                    {liveStats.byStatus.length === 0 && <Empty>No estimates recorded yet.</Empty>}
                    <div className="space-y-3">
                      {liveStats.byStatus.map((s) => {
                        const max = Math.max(...liveStats.byStatus.map((x) => x.count), 1);
                        return (
                          <div key={s.status}>
                            <div className="mb-1 flex justify-between text-[13px] font-bold">
                              <span className="text-slate-700">{s.status}</span>
                              <span className="text-red-600">
                                {s.count} orders · {formatINR(s.value, { compact: true })}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(s.count / max) * 100}%` }}
                                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel title="Low Stock Alerts">
                    <div className="space-y-2.5">
                      {(stats?.lowStock ?? []).map((p) => (
                        <div key={p.sku} className="flex items-center justify-between text-[13px] font-bold">
                          <span className="truncate pr-4 text-slate-700">{p.name}</span>
                          <span className={p.stock < 200 ? "text-red-600" : "text-slate-500"}>
                            {p.stock} units
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {/* Orders & Estimates Tab */}
            {tab === "estimates" && (
              <Panel title={`Orders & Estimates (${estimates.length})`}>
                {estimates.length === 0 && (
                  <Empty>No orders submitted yet. Build an estimate from the storefront to see live orders here.</Empty>
                )}
                <div className="overflow-x-auto">
                  {estimates.length > 0 && (
                    <table className="w-full min-w-[1080px] text-[13.5px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-[2px] text-slate-500">
                          <th className="py-3 px-3">Order Ref</th>
                          <th className="py-3 px-3">Customer & Contact</th>
                          <th className="py-3 px-3">Full Delivery Address</th>
                          <th className="py-3 px-3 text-center">Items</th>
                          <th className="py-3 px-3 text-right">Grand Total</th>
                          <th className="py-3 px-3">Payment Status & Action</th>
                          <th className="py-3 px-3">Fulfillment Workflow Buttons</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimates.map((e) => (
                          <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                            {/* 1. Order Ref */}
                            <td className="py-4 px-3 font-bold">
                              <Link href={`/estimate/${e.estimateNumber}`} target="_blank" className="text-red-600 hover:underline flex items-center gap-1">
                                {e.estimateNumber} <ExternalLink size={12} />
                              </Link>
                              <p className="text-[11px] font-medium text-slate-400">
                                {new Date(e.createdAt).toLocaleDateString("en-IN")}
                              </p>
                              <span className="mt-1.5 inline-block rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-700 uppercase">
                                {e.status}
                              </span>
                            </td>

                            {/* 2. Customer & Contact */}
                            <td className="py-4 px-3">
                              <p className="font-bold text-slate-900">{e.customerName}</p>
                              <a href={`https://wa.me/91${e.mobile}`} target="_blank" rel="noreferrer" className="text-[11.5px] font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
                                <MessageCircle size={13} /> +91 {e.mobile}
                              </a>
                            </td>

                            {/* 3. Delivery Address */}
                            <td className="py-4 px-3 text-slate-700 text-xs font-medium max-w-[220px]">
                              <p className="line-clamp-2">{e.address || "Direct Factory Address"}</p>
                              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                {[e.city, e.district, e.state].filter(Boolean).join(", ")}
                              </p>
                            </td>

                            {/* 4. Items */}
                            <td className="py-4 px-3 text-center font-bold text-slate-800">{e.itemCount} pcs</td>

                            {/* 5. Grand Total */}
                            <td className="py-4 px-3 text-right font-bold text-red-600 font-display text-base">
                              {formatINR(Number(e.grandTotal))}
                            </td>

                            {/* 6. Payment Status & Action (One-Time Use, Permanently Locked Once Paid) */}
                            <td className="py-4 px-3 min-w-[170px]">
                              <div className="flex flex-col gap-1.5">
                                {e.paymentStatus === "PAID" ? (
                                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-2 text-[11px] font-extrabold text-emerald-800 shadow-xs">
                                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                    <span>PAID ({e.paymentMethod || "UPI"})</span>
                                    <span className="rounded-full bg-emerald-200 text-emerald-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-mono">LOCKED</span>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      disabled={paymentUpdatingId === e.estimateNumber}
                                      onClick={() => markPaymentReceived(e.estimateNumber, "UPI Verification")}
                                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-3 py-1.5 text-[11px] font-bold shadow-sm flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      <CheckCircle2 size={13} /> {paymentUpdatingId === e.estimateNumber ? "Confirming..." : "Mark Payment Received"}
                                    </button>
                                    <button
                                      disabled={paymentUpdatingId === e.estimateNumber}
                                      onClick={() => setPaymentModalOrder(e)}
                                      className="rounded-xl bg-amber-50 border border-amber-300 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100 text-center disabled:opacity-50 cursor-pointer"
                                    >
                                      💳 Confirm Other Method
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* 7. Fulfillment Workflow Action Buttons (Strictly One-Time Sequential Use) */}
                            <td className="py-4 px-3">
                              {(() => {
                                const isPackaged = e.status === "PACKAGE READY" || e.status === "SHIPPED" || e.status === "OUT FOR DELIVERY" || e.status === "DELIVERED";
                                const isShipped = e.status === "SHIPPED" || e.status === "OUT FOR DELIVERY" || e.status === "DELIVERED";
                                const isOutForDelivery = e.status === "OUT FOR DELIVERY" || e.status === "DELIVERED";
                                const isDelivered = e.status === "DELIVERED";

                                return (
                                  <div className="flex flex-col gap-1.5 min-w-[165px]">
                                    {/* Step A: Package Ready */}
                                    <button
                                      disabled={isPackaged || updatingStatusId === `${e.estimateNumber}-PACKAGE READY`}
                                      onClick={() => updateStatus(e.estimateNumber, "PACKAGE READY", e.mobile)}
                                      className={`flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                                        isPackaged
                                          ? "bg-purple-100 border border-purple-300 text-purple-800 opacity-90 cursor-default"
                                          : updatingStatusId === `${e.estimateNumber}-PACKAGE READY`
                                            ? "bg-purple-400 text-white cursor-wait"
                                            : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer"
                                      }`}
                                    >
                                      <Package size={13} /> {isPackaged ? "✓ Packaged (Locked)" : updatingStatusId === `${e.estimateNumber}-PACKAGE READY` ? "Updating..." : "Mark Packaged"}
                                    </button>

                                    {/* Step B: Shipped */}
                                    <button
                                      disabled={isShipped || !isPackaged || updatingStatusId === `${e.estimateNumber}-SHIPPED`}
                                      onClick={() => updateStatus(e.estimateNumber, "SHIPPED", e.mobile)}
                                      className={`flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                                        isShipped
                                          ? "bg-blue-100 border border-blue-300 text-blue-800 opacity-90 cursor-default"
                                          : isPackaged
                                            ? updatingStatusId === `${e.estimateNumber}-SHIPPED`
                                              ? "bg-blue-400 text-white cursor-wait"
                                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                      }`}
                                    >
                                      <Truck size={13} /> {isShipped ? "✓ Shipped (Locked)" : updatingStatusId === `${e.estimateNumber}-SHIPPED` ? "Updating..." : "Mark Shipped"}
                                    </button>

                                    {/* Step C: Out for Delivery */}
                                    <button
                                      disabled={isOutForDelivery || !isShipped || updatingStatusId === `${e.estimateNumber}-OUT FOR DELIVERY`}
                                      onClick={() => updateStatus(e.estimateNumber, "OUT FOR DELIVERY", e.mobile)}
                                      className={`flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                                        isOutForDelivery
                                          ? "bg-amber-100 border border-amber-300 text-amber-800 opacity-90 cursor-default"
                                          : isShipped
                                            ? updatingStatusId === `${e.estimateNumber}-OUT FOR DELIVERY`
                                              ? "bg-amber-400 text-white cursor-wait"
                                              : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer"
                                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                      }`}
                                    >
                                      <Truck size={13} /> {isOutForDelivery ? "✓ Out for Delivery (Locked)" : updatingStatusId === `${e.estimateNumber}-OUT FOR DELIVERY` ? "Updating..." : "Mark Out for Delivery"}
                                    </button>

                                    {/* Step D: Delivered */}
                                    <button
                                      disabled={isDelivered || !isOutForDelivery || updatingStatusId === `${e.estimateNumber}-DELIVERED`}
                                      onClick={() => updateStatus(e.estimateNumber, "DELIVERED", e.mobile)}
                                      className={`flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                                        isDelivered
                                          ? "bg-emerald-100 border border-emerald-300 text-emerald-800 opacity-90 cursor-default"
                                          : isOutForDelivery
                                            ? updatingStatusId === `${e.estimateNumber}-DELIVERED`
                                              ? "bg-emerald-400 text-white cursor-wait"
                                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                      }`}
                                    >
                                      <CheckCircle2 size={13} /> {isDelivered ? "✓ Delivered (Complete)" : updatingStatusId === `${e.estimateNumber}-DELIVERED` ? "Updating..." : "Mark Delivered"}
                                    </button>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Panel>
            )}

            {/* Inventory Tab */}
            {tab === "inventory" && (
              <Panel
                title={
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-base font-black text-slate-900">Product Catalogue ({filteredProducts.length})</span>
                      {isDraft ? (
                        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-black text-amber-800 shadow-xs">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>🛠️ Work Mode (Draft edits pending)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-800 shadow-xs">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <span>🟢 Live Website (Synchronized)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handlePublishWholeWebsite}
                        disabled={savingWholeWebsite}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white px-5 py-2.5 text-[12.5px] font-black uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save size={16} />
                        {savingWholeWebsite ? "Publishing Live..." : "💾 Save Whole Website & Publish Live"}
                      </button>
                      <button
                        onClick={openAddProduct}
                        className="btn-gold flex items-center gap-2 px-5 py-2.5 text-[12.5px] uppercase font-bold cursor-pointer shadow-sm"
                      >
                        <Plus size={16} /> Upload New Product
                      </button>
                      <button
                        onClick={handleClearAllProducts}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xs cursor-pointer"
                        title="Clear catalogue and start fresh"
                      >
                        <Trash2 size={13} /> Clear
                      </button>
                    </div>
                  </div>
                }
              >
                {/* Search & Category Filter Header */}
                <div className="mb-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[280px]">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by product name, SKU or category…"
                        className="field pl-11 !bg-slate-50 !border-slate-200 !text-slate-900 font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Category Filter:</label>
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xs focus:border-red-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="ALL">All Categories ({products.length})</option>
                        {allCategoryPills.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.icon} {cat.name} ({cat.count})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Category Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    <button
                      onClick={() => setSelectedCategoryFilter("ALL")}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                        selectedCategoryFilter === "ALL"
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>🔥 All Categories</span>
                      <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        selectedCategoryFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}>
                        {products.length}
                      </span>
                    </button>
                    {allCategoryPills.map((cat) => {
                      const isActive = selectedCategoryFilter.toLowerCase() === cat.name.toLowerCase();
                      return (
                        <button
                          key={cat.name}
                          onClick={() => setSelectedCategoryFilter(isActive ? "ALL" : cat.name)}
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <span>{cat.icon} {cat.name}</span>
                          <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                            isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                          }`}>
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category-Wise Grouped Product Sections */}
                <div className="space-y-6">
                  {categoryGroups.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                      No products found matching your filter.
                    </div>
                  ) : (
                    categoryGroups.map((group, gIdx) => (
                      <div
                        key={group.category}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        {/* Category Header Card */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-3 text-white">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{group.icon}</span>
                            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                              {group.category}
                            </h3>
                            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              {group.items.length} {group.items.length === 1 ? "Product" : "Products"}
                            </span>
                            {draftCategories.has(group.category) ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-black text-amber-300 animate-pulse">
                                🟡 Draft Order
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                <Check size={10} /> Saved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleSaveCategory(group.category)}
                              disabled={savingCategory === group.category}
                              title="Save category order and lock SKUs cleanly"
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black shadow-sm transition cursor-pointer disabled:opacity-50 ${
                                draftCategories.has(group.category)
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400 ring-2 ring-amber-300 font-black scale-105"
                                  : "border border-emerald-500/40 bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50"
                              }`}
                            >
                              <Save size={13} />
                              {savingCategory === group.category
                                ? "Saving..."
                                : draftCategories.has(group.category)
                                ? "💾 Save Category *"
                                : "💾 Save Category"}
                            </button>
                            <button
                              onClick={() => handleAutoSequenceCategorySkus(group.category)}
                              title="Auto-align SKUs in this category with row rank #1..#N"
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 text-[11px] font-black text-amber-300 transition cursor-pointer"
                            >
                              🔢 Auto-Align SKUs
                            </button>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Category #{gIdx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Category Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[950px] text-[13.5px]">
                            <thead className="bg-slate-50 border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-[1.5px] text-slate-600">
                              <tr>
                                <th className="py-3 px-2 text-center w-[90px]">Order</th>
                                <th className="py-3 px-2 text-center w-[60px]">#</th>
                                <th className="py-3 px-2 w-[130px]">SKU</th>
                                <th className="py-3 px-2">Product Name</th>
                                <th className="py-3 px-2 w-[130px]">Packing</th>
                                <th className="py-3 px-2 text-right w-[110px]">MRP</th>
                                <th className="py-3 px-2 text-right w-[120px]">Offer Price</th>
                                <th className="py-3 px-2 text-right w-[90px]">Stock</th>
                                <th className="py-3 px-3 text-center w-[200px]">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {group.items.map((p, idx) => {
                                const isDragging = draggedProduct?.id === p.id;
                                return (
                                  <tr
                                    key={String(p.id)}
                                    draggable={true}
                                    onDragStart={() => handleDragStart(p.id, group.category, idx)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(group.category, idx)}
                                    className={`transition-colors hover:bg-amber-50/40 ${
                                      isDragging ? "opacity-40 bg-amber-100 ring-2 ring-amber-400" : ""
                                    }`}
                                  >
                                    {/* Drag Handle & Move Controls */}
                                    <td className="py-2.5 px-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <div
                                          title="Click & Drag to reposition"
                                          className="cursor-grab text-slate-400 hover:text-slate-700 p-0.5"
                                        >
                                          <GripVertical size={15} />
                                        </div>
                                        <button
                                          disabled={idx === 0}
                                          onClick={() => handleMoveItemWithinCategory(group.category, idx, idx - 1)}
                                          title="Move Up"
                                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                                        >
                                          <ArrowUp size={13} />
                                        </button>
                                        <button
                                          disabled={idx === group.items.length - 1}
                                          onClick={() => handleMoveItemWithinCategory(group.category, idx, idx + 1)}
                                          title="Move Down"
                                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                                        >
                                          <ArrowDown size={13} />
                                        </button>
                                      </div>
                                    </td>
                                    {/* Rank Number */}
                                    <td className="py-2.5 px-2 text-center">
                                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 border border-slate-200">
                                        #{idx + 1}
                                      </span>
                                    </td>
                                    {/* SKU */}
                                    <td className="py-2.5 px-2 font-mono font-bold text-slate-700">
                                      <span className="rounded bg-red-50 border border-red-200 px-1.5 py-0.5 text-[11.5px] text-red-700">
                                        {p.sku}
                                      </span>
                                    </td>
                                    {/* Product Name */}
                                    <td className="py-2.5 px-2">
                                      <div className="font-bold text-slate-900">{p.name}</div>
                                    </td>
                                    {/* Packing */}
                                    <td className="py-2.5 px-2 text-slate-500 text-[12px] font-medium">
                                      {p.packing || "1 Box"}
                                    </td>
                                    {/* MRP */}
                                    <td className="py-2.5 px-2 text-right">
                                      {inlineEditingId === p.id ? (
                                        <input
                                          type="number"
                                          value={inlineMrp}
                                          onChange={(e) => setInlineMrp(Number(e.target.value))}
                                          className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold text-slate-800 shadow-inner"
                                          placeholder="MRP"
                                        />
                                      ) : (
                                        <span className="text-slate-400 line-through text-xs">{formatINR(Number(p.mrp))}</span>
                                      )}
                                    </td>
                                    {/* Offer Price */}
                                    <td className="py-2.5 px-2 text-right">
                                      {inlineEditingId === p.id ? (
                                        <input
                                          type="number"
                                          value={inlineOfferPrice}
                                          onChange={(e) => setInlineOfferPrice(Number(e.target.value))}
                                          className="w-20 rounded-lg border-2 border-red-500 bg-red-50 px-2 py-1 text-right text-xs font-black text-red-600 shadow-inner focus:outline-hidden"
                                          placeholder="Offer ₹"
                                        />
                                      ) : (
                                        <span className="font-black text-red-600 text-[14px]">{formatINR(Number(p.offerPrice))}</span>
                                      )}
                                    </td>
                                    {/* Stock */}
                                    <td className="py-2.5 px-2 text-right">
                                      {inlineEditingId === p.id ? (
                                        <input
                                          type="number"
                                          value={inlineStock}
                                          onChange={(e) => setInlineStock(Number(e.target.value))}
                                          className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold text-slate-800 shadow-inner"
                                          placeholder="Stock"
                                        />
                                      ) : (
                                        <span
                                          className={`font-bold text-xs ${
                                            Number(p.stock) < 200 ? "text-red-600" : "text-emerald-600"
                                          }`}
                                        >
                                          {p.stock}
                                        </span>
                                      )}
                                    </td>
                                    {/* Action Buttons */}
                                    <td className="py-2.5 px-3 text-center">
                                      {inlineEditingId === p.id ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            onClick={() => handleQuickSaveInline(p)}
                                            disabled={savingInline}
                                            title="Save Price & Stock changes"
                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-[11.5px] font-black hover:bg-emerald-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
                                          >
                                            <Check size={13} /> {savingInline ? "Saving..." : "Save"}
                                          </button>
                                          <button
                                            onClick={() => setInlineEditingId(null)}
                                            title="Cancel"
                                            className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                                          >
                                            <X size={13} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            onClick={() => {
                                              setInlineEditingId(p.id);
                                              setInlineMrp(Number(p.mrp));
                                              setInlineOfferPrice(Number(p.offerPrice));
                                              setInlineStock(Number(p.stock));
                                            }}
                                            title="Quick Price Change"
                                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-900 hover:bg-amber-100 shadow-2xs transition cursor-pointer"
                                          >
                                            <Zap size={12} className="text-amber-600 fill-amber-600" /> ₹ Edit
                                          </button>
                                          <button
                                            onClick={() => openEditProduct(p)}
                                            title="Edit Full Details"
                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-red-500 hover:text-red-600 shadow-2xs transition cursor-pointer"
                                          >
                                            <Edit size={12} /> Full Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteProduct(p.id)}
                                            title="Delete product"
                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-400 hover:border-red-600 hover:bg-red-600 hover:text-white transition shadow-2xs cursor-pointer"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            )}

            {/* Categories Management Tab */}
            {tab === "categories" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                      Product Categories ({categoriesList.length})
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Create new categories (e.g. KIDS SPECIAL), rename them, and assign products directly.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewCategoryName("");
                      setSelectedProductIdsForNewCat([]);
                      setCategoryModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-red-700"
                  >
                    <Plus size={16} /> New Category
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoriesList.map((c) => {
                    const catProds = products.filter(
                      (p) => p.categoryName?.trim().toUpperCase() === c.name?.trim().toUpperCase()
                    );
                    return (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-red-500/15 bg-white p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-700 mb-1">
                              Category
                            </span>
                            <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                              {c.name}
                            </h3>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {catProds.length} items
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                          {catProds.length > 0
                            ? catProds.slice(0, 3).map((p) => p.name).join(", ") + (catProds.length > 3 ? ` +${catProds.length - 3} more` : "")
                            : "No products assigned yet"}
                        </p>

                        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                          <button
                            onClick={() => {
                              setRenamingCat({ id: c.id, name: c.name });
                              setRenameValue(c.name);
                            }}
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold text-slate-700 hover:border-red-500 hover:text-red-600 transition"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => {
                              setAssignModalCat({ id: c.id, name: c.name });
                              setAssignProductIds(catProds.map((p) => p.id));
                              setAssignSearch("");
                            }}
                            className="flex-1 rounded-xl bg-red-50 border border-red-200 py-2 text-center text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white transition"
                          >
                            Assign Products
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Festive Banner Settings Tab */}
            {tab === "banner" && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                      Homepage Festival Offer Banner
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Full-width promotional banner shown on the homepage right below Instant Order.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveBanner}
                    disabled={savingBanner}
                    className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <Save size={16} /> {savingBanner ? "Saving..." : "Save Banner"}
                  </button>
                </div>

                <div className="rounded-[28px] border border-red-500/15 bg-white p-6 sm:p-8 shadow-md space-y-5">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="block text-sm font-bold text-slate-900">Banner Visibility</span>
                      <span className="block text-xs text-slate-500">Show this festival banner on the public homepage</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, enabled: !bannerForm.enabled })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        bannerForm.enabled ? "bg-red-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          bannerForm.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Festival Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Festival Title (Tamil / English)
                    </label>
                    <input
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="e.g. விநாயகர் சதுர்த்தி & தீபாவளி மெகா சலுகை!"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-600"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Offer Subtitle / Description
                    </label>
                    <input
                      value={bannerForm.subtitle}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      placeholder="e.g. Sivakasi Direct Factory Fireworks · Flat 80% Off MRP on All Premium Crackers"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Festive Badge */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Festive Badge Tag
                      </label>
                      <input
                        value={bannerForm.badge}
                        onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                        placeholder="e.g. 🐘 Vinayagar Chaturthi & Diwali Mega Sale"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-red-600"
                      />
                    </div>

                    {/* Discount Highlight */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Discount Highlight Text
                      </label>
                      <input
                        value={bannerForm.discountText}
                        onChange={(e) => setBannerForm({ ...bannerForm, discountText: e.target.value })}
                        placeholder="e.g. 80% FLAT DISCOUNT · ALL TAMIL NADU DELIVERY"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* Image URL & Presets */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Banner Background Image URL
                    </label>
                    <input
                      value={bannerForm.imageUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-red-600 mb-2"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[11px] font-bold text-slate-500">Quick Festival Presets:</span>
                      {[
                        { l: "Vinayagar Chaturthi & Diwali", url: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=1600&q=80" },
                        { l: "Golden Fireworks", url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80" },
                        { l: "Night Sky Sparks", url: "https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&w=1600&q=80" },
                        { l: "Festival Celebration", url: "https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?auto=format&fit=crop&w=1600&q=80" },
                      ].map((preset) => (
                        <button
                          key={preset.l}
                          type="button"
                          onClick={() => setBannerForm({ ...bannerForm, imageUrl: preset.url })}
                          className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          {preset.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        CTA Button Text
                      </label>
                      <input
                        value={bannerForm.buttonText}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                        placeholder="e.g. Instant Order / Cart"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        CTA Button Link
                      </label>
                      <input
                        value={bannerForm.buttonLink}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                        placeholder="e.g. /estimate or /products"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* Live Preview Card */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Live Homepage Preview:
                    </label>
                    <div className="relative overflow-hidden rounded-[24px] border-2 border-amber-500/40 bg-gradient-to-br from-slate-950 via-red-950 to-amber-950 p-6 text-center text-white shadow-xl">
                      <div
                        className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-25"
                        style={{ backgroundImage: `url(${bannerForm.imageUrl})` }}
                      />
                      <div className="relative z-10">
                        <span className="inline-block rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[10px] font-black uppercase text-amber-300 mb-2">
                          {bannerForm.badge}
                        </span>
                        <h3 className="font-display text-xl sm:text-2xl font-black text-white">{bannerForm.title}</h3>
                        <p className="mt-1 text-xs text-slate-200 max-w-xl mx-auto">{bannerForm.subtitle}</p>
                        <div className="mt-4 inline-flex rounded-full bg-red-600 px-5 py-2 text-xs font-extrabold uppercase text-white shadow">
                          {bannerForm.buttonText} →
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dealers Tab */}
            {tab === "dealers" && (
              <Panel title={`Dealer Applications (${dealers.length})`}>
                {dealers.length === 0 && <Empty>No dealer applications yet.</Empty>}
                <div className="space-y-3">
                  {dealers.map((d) => (
                    <div key={String(d.id)} className="rounded-2xl border border-red-500/15 bg-white p-5 shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-bold text-slate-900">{d.businessName}</p>
                          <p className="text-[12.5px] font-medium text-slate-600">
                            {d.contactName} · {d.mobile} · {d.city}, {d.state}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700">
                            {d.tier}
                          </span>
                          <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-bold text-red-600">
                            {d.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Enquiries Tab */}
            {tab === "enquiries" && (
              <Panel title={`Customer Enquiries (${enquiries.length})`}>
                {enquiries.length === 0 && <Empty>No enquiries received yet.</Empty>}
                <div className="space-y-3">
                  {enquiries.map((e) => (
                    <div key={String(e.id)} className="rounded-2xl border border-red-500/15 bg-white p-5 shadow-md">
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] font-bold text-slate-900">{e.name}</p>
                        <span className="text-[12px] font-bold text-slate-500">{e.mobile}</span>
                      </div>
                      <p className="mt-1 text-[12px] font-bold uppercase tracking-[2px] text-red-600">{e.subject}</p>
                      <p className="mt-2 text-[13.5px] font-medium text-slate-700">{e.message}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Analytics Tab */}
            {tab === "analytics" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Revenue Funnel">
                  <div className="space-y-4">
                    {[
                      { l: "Estimates Received", v: k?.estimateCount ?? 0 },
                      { l: "Package Ready", v: stats?.byStatus.find((s) => s.status === "PACKAGE READY")?.count ?? 0 },
                      { l: "Shipped", v: stats?.byStatus.find((s) => s.status === "SHIPPED")?.count ?? 0 },
                      { l: "Delivered", v: stats?.byStatus.find((s) => s.status === "DELIVERED")?.count ?? 0 },
                    ].map((s, i) => (
                      <div key={s.l}>
                        <div className="mb-1 flex justify-between text-[13px] font-bold">
                          <span className="text-slate-700">{s.l}</span>
                          <span className="text-red-600">{s.v}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(6, 100 - i * 22)}%` }}
                            transition={{ duration: 0.9, delay: i * 0.08 }}
                            className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Product Upload / Edit Modal */}
      <AnimatePresence>
        {productModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProductModalOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[32px] border border-red-500/20 bg-white p-8 shadow-2xl"
            >
              <button
                onClick={() => setProductModalOpen(false)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white"
              >
                <X size={16} />
              </button>

              <h2 className="font-display text-2xl font-bold text-slate-900">
                {editingProduct ? "Edit Product & Price" : "Upload New Product"}
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Configure details, MRP, factory offer price, packing, and collection flags.
              </p>

              <form onSubmit={handleSaveProduct} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Product Name *</span>
                  <input
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    placeholder="e.g. 10 Shot Sky Thunder"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">SKU Code *</span>
                    <input
                      required
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Category *</span>
                      <button
                        type="button"
                        onClick={() => {
                          const customName = prompt("Enter New Category Name (e.g. KIDS SPECIAL):");
                          if (customName && customName.trim()) {
                            const upper = customName.trim().toUpperCase();
                            setProductForm({ ...productForm, categoryName: upper });
                            fetch("/api/v1/categories", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: upper }),
                            }).then(() => load());
                          }
                        }}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        + New Category
                      </button>
                    </div>
                    <select
                      value={productForm.categoryName}
                      onChange={(e) => setProductForm({ ...productForm, categoryName: e.target.value })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    >
                      {Array.from(
                        new Set([
                          productForm.categoryName,
                          ...categoriesList.map((c) => c.name),
                          ...products.map((p) => p.categoryName),
                          "SOUND CRACKERS", "GROUND CHAKKARS", "FLOWER POTS", "TWINKLING STARS",
                          "SPARKLERS", "ROCKETS", "FOUNTAINS", "COLOR SMOKE", "FANCY NOVELTIES",
                          "SINGLE SHOTS", "REPEATERS", "DELUXE CRACKERS", "GIFT BOXES", "KIDS SPECIAL"
                        ])
                      )
                        .filter(Boolean)
                        .map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">MRP (₹) *</span>
                    <input
                      type="number"
                      required
                      value={productForm.mrp}
                      onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Offer Price (₹) *</span>
                    <input
                      type="number"
                      required
                      value={productForm.offerPrice}
                      onChange={(e) => setProductForm({ ...productForm, offerPrice: Number(e.target.value) })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Packing</span>
                    <input
                      value={productForm.packing}
                      onChange={(e) => setProductForm({ ...productForm, packing: e.target.value })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">MOQ</span>
                    <input
                      type="number"
                      value={productForm.moq}
                      onChange={(e) => setProductForm({ ...productForm, moq: Number(e.target.value) })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Stock</span>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                </div>

                {/* Product Images (Image 1, Image 2, Image 3) */}
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-[2px] text-red-600 block">
                    📸 Product Photos (Upload up to 3 Images)
                  </span>

                  {/* Primary Cover Image 1 */}
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-700 block mb-1">1. Primary Cover Photo *</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/v1/admin/upload", { method: "POST", body: fd });
                          const json = await res.json();
                          if (json.success) {
                            setProductForm((prev) => ({ ...prev, imageUrl: json.data.url }));
                            setNotificationToast("📸 Main Cover Photo 1 uploaded!");
                            setTimeout(() => setNotificationToast(null), 3000);
                          }
                        }}
                        className="field !bg-white !border-slate-300 font-bold text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-red-600 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white cursor-pointer"
                      />
                      {productForm.imageUrl && (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={productForm.imageUrl} alt="P1" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                    <input
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      placeholder="Or paste Cover Photo 1 URL..."
                      className="field mt-1.5 !bg-white !border-slate-300 font-bold text-xs"
                    />
                  </div>

                  {/* Gallery Image 2 */}
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-700 block mb-1">2. Second Gallery Photo (Optional)</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/v1/admin/upload", { method: "POST", body: fd });
                          const json = await res.json();
                          if (json.success) {
                            setProductForm((prev) => ({ ...prev, imageUrl2: json.data.url }));
                            setNotificationToast("📸 Gallery Photo 2 uploaded!");
                            setTimeout(() => setNotificationToast(null), 3000);
                          }
                        }}
                        className="field !bg-white !border-slate-300 font-bold text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white cursor-pointer"
                      />
                      {productForm.imageUrl2 && (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={productForm.imageUrl2} alt="P2" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                    <input
                      value={productForm.imageUrl2}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl2: e.target.value })}
                      placeholder="Or paste Gallery Photo 2 URL..."
                      className="field mt-1.5 !bg-white !border-slate-300 font-bold text-xs"
                    />
                  </div>

                  {/* Gallery Image 3 */}
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-700 block mb-1">3. Third Gallery Photo (Optional)</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/v1/admin/upload", { method: "POST", body: fd });
                          const json = await res.json();
                          if (json.success) {
                            setProductForm((prev) => ({ ...prev, imageUrl3: json.data.url }));
                            setNotificationToast("📸 Gallery Photo 3 uploaded!");
                            setTimeout(() => setNotificationToast(null), 3000);
                          }
                        }}
                        className="field !bg-white !border-slate-300 font-bold text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white cursor-pointer"
                      />
                      {productForm.imageUrl3 && (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={productForm.imageUrl3} alt="P3" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                    <input
                      value={productForm.imageUrl3}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl3: e.target.value })}
                      placeholder="Or paste Gallery Photo 3 URL..."
                      className="field mt-1.5 !bg-white !border-slate-300 font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Product Demo Video Section */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[2px] text-amber-800 block">
                    🎬 Product Demo Video (Video File Upload / MP4 / YouTube Link)
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/v1/admin/upload", { method: "POST", body: fd });
                        const json = await res.json();
                        if (json.success) {
                          setProductForm((prev) => ({ ...prev, videoUrl: json.data.url }));
                          setNotificationToast("🎬 Product Demo Video uploaded!");
                          setTimeout(() => setNotificationToast(null), 3000);
                        }
                      }}
                      className="field !bg-white !border-slate-300 font-bold text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-amber-600 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white cursor-pointer"
                    />
                  </div>
                  <input
                    value={productForm.videoUrl}
                    onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                    placeholder="Or paste direct Video URL or YouTube link..."
                    className="field !bg-white !border-slate-300 font-bold text-xs"
                  />
                  {productForm.videoUrl && (
                    <p className="text-[11px] font-bold text-amber-800 pt-1">
                      ✓ Demo Video Linked: {productForm.videoUrl.slice(0, 45)}...
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isNewArrival}
                      onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                      className="accent-red-600"
                    />
                    New Arrival
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isBestSeller}
                      onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                      className="accent-red-600"
                    />
                    Best Seller
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isPremium}
                      onChange={(e) => setProductForm({ ...productForm, isPremium: e.target.checked })}
                      className="accent-red-600"
                    />
                    Premium Collection
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingProduct}
                  className="btn-gold mt-6 w-full py-3.5 text-sm uppercase font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingProduct ? (
                    <>
                      <span className="animate-spin">⏳</span> Saving Changes & Updating Live...
                    </>
                  ) : editingProduct ? (
                    "💾 Save Product Changes & Publish Live"
                  ) : (
                    "🎉 Create & Publish Product Live"
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Gateway Modal */}
      <AnimatePresence>
        {paymentModalOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPaymentModalOrder(null)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[32px] border border-red-500/20 bg-white p-8 shadow-2xl text-center"
            >
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white"
              >
                <X size={16} />
              </button>

              <QrCode size={36} className="mx-auto text-red-600" />
              <h2 className="mt-3 font-display text-xl font-bold text-slate-900">Payment Gateway</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Confirm payment for Order <span className="font-bold text-red-600">{paymentModalOrder.estimateNumber}</span> ({formatINR(Number(paymentModalOrder.grandTotal))})
              </p>

              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-50 p-4 text-center">
                {/* SVG QR Code Simulation */}
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl bg-white border border-slate-200 p-2 shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=mayilon@upi&pn=Mayilon%20Crackers&am=${paymentModalOrder.grandTotal}`}
                    alt="All UPI QR Code"
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-2 text-[11px] font-bold text-slate-700">Scan via GPay, PhonePe, Paytm or BHIM</p>
                <p className="text-[10px] text-slate-500">UPI ID: mayiloncrackers@sbi</p>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => handleMarkPaid(paymentModalOrder.estimateNumber, "Dynamic All-UPI QR")}
                  className="btn-gold w-full py-3 text-xs uppercase font-bold"
                >
                  ✓ Confirm Payment via UPI QR
                </button>
                <button
                  onClick={() => handleMarkPaid(paymentModalOrder.estimateNumber, "Razorpay Gateway")}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-900 py-3 text-xs font-bold uppercase text-white hover:bg-slate-800"
                >
                  Confirm via Razorpay
                </button>
                <button
                  onClick={() => handleMarkPaid(paymentModalOrder.estimateNumber, "PayU Gateway")}
                  className="w-full rounded-2xl border border-slate-200 bg-blue-600 py-3 text-xs font-bold uppercase text-white hover:bg-blue-700"
                >
                  Confirm via PayU
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Create New Category Modal */}
      <AnimatePresence>
        {categoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCategoryModalOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[32px] border border-red-500/20 bg-white p-7 shadow-2xl"
            >
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white"
              >
                <X size={16} />
              </button>

              <h2 className="font-display text-xl font-bold text-slate-900">
                Create New Category
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Add a new category (e.g. KIDS SPECIAL) and select initial products to add.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category Name *
                  </label>
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. KIDS SPECIAL"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-600"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Select Products to Assign ({selectedProductIdsForNewCat.length} selected)
                    </label>
                    <input
                      value={catSearchFilter}
                      onChange={(e) => setCatSearchFilter(e.target.value)}
                      placeholder="Search..."
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs outline-none focus:border-red-600 w-28"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1">
                    {products
                      .filter((p) =>
                        !catSearchFilter.trim() ||
                        p.name.toLowerCase().includes(catSearchFilter.toLowerCase()) ||
                        p.sku.toLowerCase().includes(catSearchFilter.toLowerCase())
                      )
                      .map((p) => {
                        const selected = selectedProductIdsForNewCat.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProductIdsForNewCat((prev) =>
                                selected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className={`flex items-center justify-between rounded-lg p-2 text-xs font-medium cursor-pointer transition ${
                              selected ? "bg-red-50 text-red-700 font-bold border border-red-200" : "hover:bg-white text-slate-700"
                            }`}
                          >
                            <span className="truncate pr-2">{p.name} ({p.sku})</span>
                            <span className={`h-4 w-4 rounded flex items-center justify-center text-[10px] ${
                              selected ? "bg-red-600 text-white" : "border border-slate-300 bg-white"
                            }`}>
                              {selected ? "✓" : ""}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                  >
                    Create Category
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Rename Category Modal */}
      <AnimatePresence>
        {renamingCat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRenamingCat(null)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-[32px] border border-red-500/20 bg-white p-7 shadow-2xl"
            >
              <button
                onClick={() => setRenamingCat(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white"
              >
                <X size={16} />
              </button>

              <h2 className="font-display text-xl font-bold text-slate-900">
                Rename Category
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Renaming will update the category name across all assigned products.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category Name *
                  </label>
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-600"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenamingCat(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRenameCategory}
                    disabled={!renameValue.trim()}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Assign Products Modal */}
      <AnimatePresence>
        {assignModalCat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAssignModalCat(null)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[32px] border border-red-500/20 bg-white p-7 shadow-2xl"
            >
              <button
                onClick={() => setAssignModalCat(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white"
              >
                <X size={16} />
              </button>

              <h2 className="font-display text-xl font-bold text-slate-900">
                Assign Products to &quot;{assignModalCat.name}&quot;
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Select or unselect products that should belong to this category.
              </p>

              <div className="mt-4 space-y-3">
                <input
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium outline-none focus:border-red-600"
                />

                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1">
                  {products
                    .filter((p) =>
                      !assignSearch.trim() ||
                      p.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(assignSearch.toLowerCase())
                    )
                    .map((p) => {
                      const selected = assignProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setAssignProductIds((prev) =>
                              selected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            );
                          }}
                          className={`flex items-center justify-between rounded-lg p-2 text-xs font-medium cursor-pointer transition ${
                            selected ? "bg-red-50 text-red-700 font-bold border border-red-200" : "hover:bg-white text-slate-700"
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold">{p.name}</span>
                            <span className="text-[11px] text-slate-500 ml-2">({p.sku}) · {p.categoryName}</span>
                          </div>
                          <span className={`h-4 w-4 shrink-0 rounded flex items-center justify-center text-[10px] ${
                            selected ? "bg-red-600 text-white" : "border border-slate-300 bg-white"
                          }`}>
                            {selected ? "✓" : ""}
                          </span>
                        </div>
                      );
                    })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-600">
                    {assignProductIds.length} products assigned
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignModalCat(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAssignedProducts}
                      className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-red-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent = "#DC2626",
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent?: string;
}) {
  return (
    <div className="glass rounded-[24px] border border-red-500/15 bg-white p-6 shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-slate-500">{label}</p>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <p className="mt-3 font-display text-[27px] font-bold text-slate-900">{value}</p>
      <p className="text-[12px] font-medium text-slate-500">{sub}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-[20px] border border-red-500/15 bg-white p-5 shadow-sm">
      <p className="text-[10.5px] font-bold uppercase tracking-[2px] text-slate-500">{label}</p>
      <p className="mt-1.5 font-display text-[21px] font-bold text-red-600">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-[26px] border border-red-500/15 bg-white p-6 shadow-md">
      {typeof title === "string" ? (
        <h3 className="mb-5 font-display text-[16px] font-bold text-slate-900">{title}</h3>
      ) : (
        <div className="mb-5">{title}</div>
      )}
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[13px] font-medium text-slate-400">{children}</p>;
}
