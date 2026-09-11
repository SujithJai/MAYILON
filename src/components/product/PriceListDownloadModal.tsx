"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Printer, Sparkles, X } from "lucide-react";

type ProductItem = {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  packing: string;
  mrp: number | string;
  offerPrice: number | string;
  discountPercent?: number;
};

export function PriceListDownloadModal({
  isOpen,
  onClose,
  products = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  products?: ProductItem[];
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  function applyOrder(items: ProductItem[], orderIds?: string[]): ProductItem[] {
    let order = orderIds;
    if (!order || order.length === 0) {
      try {
        const local = typeof window !== "undefined" ? localStorage.getItem("mayilon_permanent_product_order") : null;
        if (local) order = JSON.parse(local);
      } catch {}
    }
    if (Array.isArray(order) && order.length > 0) {
      const posMap = new Map<string, number>();
      order.forEach((id, idx) => posMap.set(id, idx));
      return [...items].sort((a, b) => {
        const pa = posMap.has(a.id) ? posMap.get(a.id)! : posMap.has(a.sku || "") ? posMap.get(a.sku || "")! : 99999;
        const pb = posMap.has(b.id) ? posMap.get(b.id)! : posMap.has(b.sku || "") ? posMap.get(b.sku || "")! : 99999;
        return pa - pb;
      });
    }
    return items;
  }

  async function getCatalog(): Promise<ProductItem[]> {
    try {
      const res = await fetch("/api/v1/products?limit=500", { cache: "no-store" }).then((r) => r.json());
      if (res?.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
        return applyOrder(res.data.items, res?.data?.productOrder);
      }
    } catch {}
    if (products && products.length > 0) {
      return applyOrder(products);
    }
    return [];
  }

  function groupByCategory(items: ProductItem[]) {
    const groups: { category: string; items: ProductItem[] }[] = [];
    const map = new Map<string, ProductItem[]>();
    for (const item of items) {
      const cat = (item.categoryName || "Special Fireworks").trim();
      if (!map.has(cat)) {
        const arr: ProductItem[] = [];
        map.set(cat, arr);
        groups.push({ category: cat, items: arr });
      }
      map.get(cat)!.push(item);
    }
    return groups;
  }

  // 1. Download as CSV / Excel (Category-Wise)
  async function downloadExcel() {
    setDownloading("excel");
    try {
      const list = await getCatalog();
      const groups = groupByCategory(list);
      let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
      csvContent += "MAYILON PYROWORLD - OFFICIAL SIVAKASI FESTIVAL PRICE LIST 2026\n";
      csvContent += "Address: 4/95, Pachayaman Kovil Street, Naranapuram, Sivakasi - 626189, Virudhunagar District\n";
      csvContent += "GSTIN: 33AABCM1234K1ZQ | PESO Licence: E-13579 | Phone: +91 90470 12345\n\n";

      let globalIdx = 0;
      groups.forEach((g) => {
        csvContent += `\n"--- ${g.category.toUpperCase()} (${g.items.length} PRODUCTS) ---",,,,,,\n`;
        csvContent += "S.No,SKU,Product Name,Packing,MRP (Rs.),Discount %,Offer Price (Rs.)\n";
        g.items.forEach((p) => {
          globalIdx += 1;
          const mrp = Number(p.mrp) || 0;
          const offer = Number(p.offerPrice) || mrp;
          const disc = p.discountPercent || (mrp > 0 ? Math.round(((mrp - offer) / mrp) * 100) : 80);
          const cleanName = `"${String(p.name).replace(/"/g, '""')}"`;
          const cleanPack = `"${String(p.packing || "1 Box").replace(/"/g, '""')}"`;
          csvContent += `${globalIdx},${p.sku || `MYL-${globalIdx}`},${cleanName},${cleanPack},${mrp.toFixed(2)},${disc}%,${offer.toFixed(2)}\n`;
        });
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Mayilon_Crackers_Price_List_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn("Excel download note:", err);
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  }

  // 2. Download as Word (.doc) (Category-Wise)
  async function downloadWord() {
    setDownloading("word");
    try {
      const list = await getCatalog();
      const groups = groupByCategory(list);
      let tableRows = "";
      let wordIdx = 0;
      groups.forEach((g) => {
        tableRows += `
          <tr style="background-color: #fee2e2; border-top: 2px solid #dc2626; border-bottom: 2px solid #dc2626;">
            <td colspan="7" style="padding: 10px; font-weight: bold; font-size: 13px; color: #991b1b; text-transform: uppercase;">
              🎆 ${g.category} &nbsp;—&nbsp; <span style="font-size: 11px; color: #7f1d1d;">(${g.items.length} Products)</span>
            </td>
          </tr>
        `;
        g.items.forEach((p) => {
          wordIdx += 1;
          const mrp = Number(p.mrp) || 0;
          const offer = Number(p.offerPrice) || mrp;
          tableRows += `
            <tr style="border-bottom: 1px solid #ddd; ${wordIdx % 2 === 0 ? "background-color: #f9f9f9;" : ""}">
              <td style="padding: 8px; text-align: center;">${wordIdx}</td>
              <td style="padding: 8px; font-weight: bold; color: #b91c1c;">${p.sku || `MYL-${wordIdx}`}</td>
              <td style="padding: 8px; font-weight: bold;">${p.name}</td>
              <td style="padding: 8px;">${p.packing || "1 Box"}</td>
              <td style="padding: 8px; text-decoration: line-through; color: #888;">₹${mrp.toFixed(2)}</td>
              <td style="padding: 8px; font-weight: bold; color: #15803d;">80% OFF</td>
              <td style="padding: 8px; font-weight: bold; color: #b91c1c; font-size: 14px;">₹${offer.toFixed(2)}</td>
            </tr>
          `;
        });
      });

      const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Mayilon Crackers Price List</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; color: #111; }
            h1 { color: #b91c1c; margin-bottom: 4px; font-size: 24px; text-transform: uppercase; }
            .sub { color: #555; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background-color: #b91c1c; color: white; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>மயிலோன் MAYILON PYROWORLD — SIVAKASI</h1>
          <div class="sub">
            <strong>Factory Direct Sivakasi Fireworks Price List 2026</strong><br/>
            Address: 4/95, Pachayaman Kovil Street, Naranapuram, Sivakasi - 626189, Virudhunagar District, Tamil Nadu<br/>
            Phone: +91 90470 12345 | Web: https://mayiloncrackers.com | PESO Lic: E-13579 | GSTIN: 33AABCM1234K1ZQ
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Packing</th>
                <th>MRP (₹)</th>
                <th>Discount</th>
                <th>Offer Price (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <p style="margin-top: 25px; font-size: 11px; color: #666; text-align: center;">
            © 2026 Mayilon Crackers Sivakasi. All orders subject to PESO safety guidelines.
          </p>
        </body>
        </html>
      `;

      const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Mayilon_Crackers_Price_List_2026.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn("Word download note:", err);
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  }

  // 3. Print / Save as PDF (Category-Wise)
  async function downloadPdf() {
    setDownloading("pdf");
    try {
      const list = await getCatalog();
      const groups = groupByCategory(list);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to open the printable PDF Price List.");
        return;
      }

      let rows = "";
      let pdfIdx = 0;
      groups.forEach((g) => {
        rows += `
          <tr class="category-divider-row" style="background: #fef2f2; border-top: 2px solid #dc2626; border-bottom: 2px solid #dc2626;">
            <td colspan="7" style="padding: 8px 12px; font-weight: 900; font-size: 12.5px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">
              🎇 ${g.category} <span style="font-size: 10.5px; font-weight: 700; background: #ffffff; color: #991b1b; padding: 2px 8px; border-radius: 9999px; margin-left: 8px; border: 1px solid #fca5a5;">${g.items.length} Products</span>
            </td>
          </tr>
        `;
        g.items.forEach((p) => {
          pdfIdx += 1;
          const mrp = Number(p.mrp) || 0;
          const offer = Number(p.offerPrice) || mrp;
          rows += `
            <tr class="${pdfIdx % 2 === 0 ? "even" : ""}">
              <td style="text-align: center; width: 35px;">${pdfIdx}</td>
              <td style="font-weight: 600; color: #991b1b; width: 90px;">${p.sku || `MYL-${pdfIdx}`}</td>
              <td style="font-weight: 700; font-size: 12.5px;">${p.name}</td>
              <td style="width: 100px; font-size: 11.5px;">${p.packing || "1 Box"}</td>
              <td style="text-align: right; text-decoration: line-through; color: #777; width: 75px;">₹${mrp.toFixed(2)}</td>
              <td style="text-align: center; color: #16a34a; font-weight: 800; width: 65px;">80%</td>
              <td style="text-align: right; font-weight: 800; color: #b91c1c; font-size: 13px; width: 85px;">₹${offer.toFixed(2)}</td>
            </tr>
          `;
        });
      });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mayilon Crackers Price List 2026 (PDF)</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #dc2626; padding-bottom: 12px; margin-bottom: 14px; }
            .logo-title { font-size: 22px; font-weight: 900; color: #dc2626; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 3px; }
            .meta { text-align: right; font-size: 10.5px; color: #475569; line-height: 1.4; }
            .tagline-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 6px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: bold; color: #991b1b; }
            table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
            th { background: #dc2626; color: white; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
            td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
            tr.even { background-color: #f8fafc; }
            tr.category-divider-row td { page-break-after: avoid; }
            .footer { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
            @media print {
              .no-print { display: none; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #1e293b; color: white; padding: 12px; text-align: center; margin-bottom: 15px; border-radius: 6px;">
            <strong>📄 Print Preview:</strong> Click the button to Save as PDF:
            <button onclick="window.print()" style="margin-left: 15px; background: #dc2626; color: white; border: none; padding: 6px 16px; font-weight: bold; border-radius: 4px; cursor: pointer;">
              🖨️ Print / Save as PDF
            </button>
          </div>

          <div class="header">
            <div>
              <div class="logo-title">மயிலோன் MAYILON</div>
              <div class="subtitle">Pyroworld · Sivakasi Direct</div>
            </div>
            <div class="meta">
              <strong>Official Deepavali Price List 2026</strong><br/>
              4/95, Pachayaman Kovil Street, Naranapuram, Sivakasi - 626189, Virudhunagar District<br/>
              PESO Licence: E-13579 | GSTIN: 33AABCM1234K1ZQ<br/>
              Customer Care: +91 90470 12345
            </div>
          </div>

          <div class="tagline-banner">
            <span>🔥 FACTORY-DIRECT SIVAKASI FIREWORKS · 80% OFF MRP</span>
            <span>⚡ ALL PRICES INCLUSIVE OF 18% GST</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
                <th>SKU</th>
                <th>Product Description</th>
                <th>Packing</th>
                <th style="text-align: right;">MRP (₹)</th>
                <th style="text-align: center;">Discount</th>
                <th style="text-align: right;">Offer Price</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="footer">
            <span>Visit: https://mayiloncrackers.com | WhatsApp: +91 90470 12345</span>
            <span>Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>

          <script>
            setTimeout(() => {
              window.print();
            }, 600);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.warn("PDF print note:", err);
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative z-10 w-full max-w-xl overflow-hidden rounded-[32px] border border-red-500/30 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
              <Download size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <Sparkles size={11} /> 2026 Official Price List
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">Download Mayilon Price List</h2>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-600">
            Get the complete factory catalog with wholesale discounts (80% Off MRP), product specifications,
            packing details, and Sivakasi direct dispatch prices.
          </p>

          <div className="mt-6 grid gap-3.5 sm:grid-cols-3">
            {/* 1. PDF Download */}
            <button
              onClick={downloadPdf}
              disabled={Boolean(downloading)}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-red-500/30 bg-red-50/50 p-5 text-center transition hover:border-red-600 hover:bg-red-50 hover:shadow-lg disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md group-hover:scale-110 transition duration-300">
                <Printer size={22} />
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-sm">PDF Price List</span>
                <span className="block text-[11px] font-medium text-slate-500 mt-0.5">Printable A4 with Logo</span>
              </div>
              <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                {downloading === "pdf" ? "Preparing..." : "Download PDF"}
              </span>
            </button>

            {/* 2. Excel Download */}
            <button
              onClick={downloadExcel}
              disabled={Boolean(downloading)}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/50 p-5 text-center transition hover:border-emerald-600 hover:bg-emerald-50 hover:shadow-lg disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md group-hover:scale-110 transition duration-300">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-sm">Excel Sheet</span>
                <span className="block text-[11px] font-medium text-slate-500 mt-0.5">.xlsx / .csv Sheet</span>
              </div>
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                {downloading === "excel" ? "Exporting..." : "Download Excel"}
              </span>
            </button>

            {/* 3. Word Download */}
            <button
              onClick={downloadWord}
              disabled={Boolean(downloading)}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-blue-500/30 bg-blue-50/50 p-5 text-center transition hover:border-blue-600 hover:bg-blue-50 hover:shadow-lg disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md group-hover:scale-110 transition duration-300">
                <FileText size={22} />
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-sm">Word Document</span>
                <span className="block text-[11px] font-medium text-slate-500 mt-0.5">Editable .doc Table</span>
              </div>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                {downloading === "word" ? "Creating..." : "Download Word"}
              </span>
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center text-[11px] font-medium text-slate-600">
            🔒 All price lists reflect direct factory wholesale rates with authentic Sivakasi PESO certification.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
