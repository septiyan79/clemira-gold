import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import PrintButton from "@/components/admin/PrintButton";
import ShareWhatsAppButton from "@/components/admin/ShareWhatsAppButton";

export const dynamic = "force-dynamic";

const SHOP_PHONE  = "0812-8737-8387";
const WEBSITE_URL = "https://clemira-gold.vercel.app";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const tdStyle: React.CSSProperties = { padding: "10px 12px", color: "#555", fontSize: 13, verticalAlign: "top" };

export default async function ConsignmentInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const logoPath   = path.join(process.cwd(), "public", "Logo CG.png");
  const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

  const [tx, qrDataUrl] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id },
      include: {
        buyer:    true,
        lines: {
          where:   { fulfillmentMode: "consignment" },
          include: {
            consignmentLine: {
              include: {
                supplier: true,
                product:  true,
              },
            },
            stockUnit: {
              include: {
                product: true,
                purchaseOrderLine: {
                  include: { purchaseOrder: { include: { supplier: true } } },
                },
              },
            },
          },
        },
      },
    }),
    QRCode.toDataURL(WEBSITE_URL, { color: { dark: "#C9A84C", light: "#ffffff" }, width: 120, margin: 1 }),
  ]);

  if (!tx || tx.lines.length === 0) notFound();

  // Use first line's supplier as the document-level supplier (fallback chain)
  const firstLine = tx.lines[0];
  const docSupplier =
    firstLine.consignmentLine?.supplier ??
    firstLine.stockUnit?.purchaseOrderLine?.purchaseOrder?.supplier;

  const totalCogs = tx.lines.reduce((s, l) => s + l.cogs.toNumber(), 0);

  return (
    <>
      <style>{`
        .ci-page-bg { background: #1A1612; min-height: 100%; padding: 24px 16px; }
        .ci-wrap {
          background: #fff; width: 794px; min-height: 1123px;
          margin: 0 auto; padding: 48px 52px;
          box-shadow: 0 4px 40px rgba(0,0,0,0.5); border-radius: 2px;
          box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact;
        }
        .ci-area-wrapper { /* default: no special behavior */ }
        .inv-toolbar {
          width: min(794px, 100%);
          margin: 0 auto 16px;
          background: rgba(26,22,18,0.92);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          position: sticky;
          top: 16px;
          z-index: 100;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .inv-toolbar-right { display: flex; align-items: center; gap: 4px; }
        .ci-table th, .ci-table td { border: 1px solid #e8e0d0; }
        .capitalize-words { text-transform: capitalize; }
        @media screen and (max-width: 600px) {
          .ci-page-bg { padding: 0; }
          .inv-toolbar {
            position: sticky; top: 0; z-index: 100;
            width: 100%; max-width: 100%; margin: 0;
            border-radius: 0; border-left: none; border-right: none; border-top: none;
            background: #1A1612; border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 8px 12px;
          }
          .ci-area-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; padding: 20px 16px 32px; }
          .inv-btn-label { display: none; }
        }
        @media print {
          .no-print { display: none !important; }
          .adm-sidebar { display: none !important; }
          .adm-body { margin-left: 0 !important; }
          .adm-body > header { display: none !important; }
          .adm-layout { height: auto !important; overflow: visible !important; }
          .adm-main { padding: 0 !important; overflow: visible !important; }
          body { background: #fff !important; }
          .ci-page-bg { background: #fff !important; padding: 0 !important; }
          .ci-wrap { box-shadow: none !important; padding: 24px !important; width: 100% !important; min-height: auto !important; }
          .ci-area-wrapper { overflow: visible !important; padding: 0 !important; }
          * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="ci-page-bg">
        {/* Toolbar */}
        <div className="no-print inv-toolbar">
          <div className="inv-toolbar-right">
            <ShareWhatsAppButton invoiceNo={tx.invoiceNo ?? ""} />
            <PrintButton />
          </div>
        </div>

        <div className="ci-area-wrapper">
        <div id="invoice-content" className="ci-wrap" style={{ fontFamily: "'Segoe UI', sans-serif", color: "#333" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "2px solid #C9A84C" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoBase64} alt="Clemira Gold" width={56} height={56} style={{ objectFit: "contain", display: "block" }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#C9A84C", letterSpacing: 0.5 }}>CLEMIRA GOLD</div>
                <div style={{ fontSize: 11, color: "#777", marginTop: 2, maxWidth: 260, lineHeight: 1.4 }}>
                  Distributor Minigold dan jual beli Logam Mulia Antam
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#333", letterSpacing: 1 }}>Bukti Beli / Buyback</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>Tanggal: {fmtDate(tx.transactedAt)}</div>
            </div>
          </div>

          {/* Pembeli / Penjual */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <div style={{ padding: "14px 18px", background: "#fafaf8", borderRadius: 8, border: "1px solid #ede5d5" }}>
              <div style={{ fontSize: 10, letterSpacing: 1.8, color: "#C9A84C", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                Pembeli
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>Clemira Gold</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{SHOP_PHONE}</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{WEBSITE_URL.replace("https://", "")}</div>
            </div>
            <div style={{ padding: "14px 18px", background: "#fafaf8", borderRadius: 8, border: "1px solid #ede5d5" }}>
              <div style={{ fontSize: 10, letterSpacing: 1.8, color: "#C9A84C", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                Penjual (Supplier)
              </div>
              {docSupplier ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{docSupplier.name}</div>
                  {"phone" in docSupplier && docSupplier.phone && (
                    <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{docSupplier.phone as string}</div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, color: "#aaa" }}>—</div>
              )}
            </div>
          </div>

          {/* Tabel Item */}
          <table className="ci-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#C9A84C" }}>
                {["#", "Brand", "Series", "Gramasi", "Serial / Certcode", "Tahun", "Harga Beli"].map((h, i) => (
                  <th key={h} style={{
                    padding: "10px 12px", color: "#fff", fontWeight: 600,
                    fontSize: 11, letterSpacing: 0.8,
                    textAlign: i === 6 ? "right" : "left",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tx.lines.map((line, i) => {
                const cl      = line.consignmentLine;
                const su      = line.stockUnit;
                const product = cl?.product ?? su?.product;
                const serial  = cl?.serialNumber ?? su?.serialNumber;
                const cert    = cl?.certCode ?? su?.certCode;
                const year    = cl?.mintYear ?? su?.mintYear;
                const cogs    = line.cogs.toNumber();
                return (
                  <tr key={line.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td className="capitalize-words" style={tdStyle}>{product?.brand ?? "—"}</td>
                    <td className="capitalize-words" style={tdStyle}>{product?.series ?? "—"}</td>
                    <td style={tdStyle}>{product ? `${product.weightGram.toNumber()} gr` : "—"}</td>
                    <td style={tdStyle}>
                      <div>{serial ?? "—"}</div>
                      {cert && <div style={{ fontSize: 11, color: "#999" }}>{cert}</div>}
                    </td>
                    <td style={tdStyle}>{year ?? "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: "#222" }}>{fmt(cogs)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f5f0e8" }}>
                <td colSpan={6} style={{ ...tdStyle, fontWeight: 700, textAlign: "right", color: "#555" }}>TOTAL</td>
                <td style={{ ...tdStyle, fontWeight: 700, textAlign: "right", fontSize: 15, color: "#C9A84C" }}>{fmt(totalCogs)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Keterangan */}
          <div style={{ padding: "16px 18px", background: "#fffdf7", border: "1px solid #e8d9b0", borderRadius: 8, marginBottom: 24, fontSize: 13, lineHeight: 1.7, color: "#555" }}>
            <div style={{ fontWeight: 700, color: "#C9A84C", marginBottom: 8, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
              Keterangan
            </div>
            <p style={{ margin: 0 }}>
              <em>Bismillahirrahmanirrahim.</em> Dengan ini kami menyatakan telah terjadi akad jual beli emas antara{" "}
              <strong style={{ color: "#222" }}>{docSupplier?.name ?? "Supplier"}</strong> selaku penjual dan{" "}
              <strong style={{ color: "#222" }}>Clemira Gold</strong> selaku pembeli, dengan rincian sebagaimana tercantum dalam dokumen ini.
              Pembayaran sebesar <strong style={{ color: "#222" }}>{fmt(totalCogs)}</strong> telah diselesaikan pada tanggal{" "}
              <strong style={{ color: "#222" }}>{fmtDate(tx.transactedAt)}</strong>.
            </p>
          </div>

          {/* QR */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Website" width={100} height={100} style={{ display: "block", margin: "0 auto 6px" }} />
            <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>{WEBSITE_URL.replace("https://", "")}</div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, textAlign: "center", fontSize: 10, color: "#ccc", borderTop: "1px solid #eee", paddingTop: 12 }}>
            Dokumen digenerate otomatis oleh sistem Clemira Gold · {WEBSITE_URL.replace("https://", "")}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
