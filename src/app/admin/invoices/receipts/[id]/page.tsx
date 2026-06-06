import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import PrintButton from "@/components/admin/PrintButton";
import ShareWhatsAppButton from "@/components/admin/ShareWhatsAppButton";

export const dynamic = "force-dynamic";

const SHOP_PHONE = "0812-8737-8387";
const WEBSITE_URL = "https://clemira-gold.vercel.app";
const BANK_NAME = "BCA";
const BANK_NUMBER = "2300474708";
const BANK_HOLDER = "Rizka Mulyanti";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const logoPath = path.join(process.cwd(), "public", "Logo CG.png");
  const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

  const [tx, qrDataUrl] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id },
      include: {
        buyer: true,
        lines: {
          include: {
            stockUnit: { include: { product: true, owner: true } },
            consignmentLine: { include: { supplier: true, product: true } },
            swapEvent: { include: { originalUnit: { include: { product: true } } } },
          },
        },
      },
    }),
    QRCode.toDataURL(WEBSITE_URL, {
      color: { dark: "#C9A84C", light: "#ffffff" },
      width: 120,
      margin: 1,
    }),
  ]);

  if (!tx) notFound();
  if (tx.status !== "paid") notFound();

  const totalSell = tx.lines.reduce((s, l) => s + l.sellPrice.toNumber(), 0);

  return (
    <>
      <style>{`
        .receipt-page-bg {
          background: #1A1612;
          min-height: 100%;
          padding: 24px 16px;
        }
        .receipt-wrap {
          background: #fff;
          width: 794px;
          min-height: 1123px;
          margin: 0 auto;
          padding: 48px 52px;
          box-shadow: 0 4px 40px rgba(0,0,0,0.5);
          border-radius: 2px;
          box-sizing: border-box;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .rcpt-toolbar {
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
          flex-wrap: wrap;
          position: sticky;
          top: 16px;
          z-index: 100;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .rcpt-party-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 18px;
        }
        .rcpt-sig-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 24px;
          align-items: flex-end;
        }
        .rcpt-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-bottom: 14px;
        }
        .rcpt-table-scroll table { min-width: 360px; margin-bottom: 0; }
        .rcpt-table th, .rcpt-table td { border: 1px solid #e8e0d0; }
        .capitalize-words { text-transform: capitalize; }
        .lunas-stamp {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-20deg);
          border: 3px solid rgba(34,139,34,0.12);
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 36px;
          font-weight: 900;
          color: rgba(34,139,34,0.09);
          letter-spacing: 5px;
          pointer-events: none;
          white-space: nowrap;
        }
        .receipt-area-wrapper { /* default: no special behavior */ }
        @media screen and (max-width: 600px) {
          .receipt-page-bg { padding: 0; }
          .rcpt-toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            width: 100%;
            max-width: 100%;
            margin: 0;
            border-radius: 0;
            border-left: none;
            border-right: none;
            border-top: none;
            background: #1A1612;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 8px 12px;
          }
          .receipt-area-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding: 20px 16px 32px;
          }
          .rcpt-party-grid { grid-template-columns: 1fr; gap: 8px; margin-bottom: 12px; }
          .rcpt-sig-grid { grid-template-columns: 1fr; gap: 10px; }
          .inv-btn-label { display: none; }
        }
        @media print {
          @page { size: A5 portrait; margin: 0; }
          .no-print { display: none !important; }
          .adm-sidebar { display: none !important; }
          .adm-body { margin-left: 0 !important; }
          .adm-body > header { display: none !important; }
          .adm-layout { height: auto !important; overflow: visible !important; }
          .adm-main { padding: 0 !important; overflow: visible !important; }
          body { background: #fff !important; }
          .receipt-page-bg { background: #fff !important; padding: 0 !important; }
          .receipt-wrap {
            zoom: 0.705 !important;
            width: 794px !important;
            box-shadow: none !important;
            min-height: auto !important;
            padding: 48px 52px !important;
          }
          .receipt-area-wrapper { overflow: visible !important; padding: 0 !important; }
          .rcpt-table-scroll { overflow: visible !important; }
          .rcpt-table-scroll table { min-width: unset !important; }
          * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="receipt-page-bg">
        {/* Tombol aksi */}
        <div className="no-print rcpt-toolbar">
          <ShareWhatsAppButton invoiceNo={tx.receiptNo ?? ""} />
          <PrintButton label="Cetak Kwitansi" />
        </div>

        <div className="receipt-area-wrapper">
        <div id="invoice-content" className="receipt-wrap" style={{ fontFamily: "'Segoe UI', sans-serif", color: "#333", position: "relative" }}>

          {/* Watermark LUNAS */}
          <div className="lunas-stamp">LUNAS</div>

          {/* ── Header ── */}
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
              <div style={{ fontSize: 24, fontWeight: 700, color: "#333", letterSpacing: 1 }}>KWITANSI</div>
              <div style={{ fontSize: 15, color: "#C9A84C", fontWeight: 600, marginTop: 4, fontFamily: "monospace" }}>
                {tx.receiptNo}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                Ref. Invoice: <span style={{ fontFamily: "monospace" }}>{tx.invoiceNo ?? "—"}</span>
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                Tanggal Bayar: {fmtDate(tx.paidAt!)}
              </div>
            </div>
          </div>

          {/* ── Status LUNAS badge ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <div style={{
              background: "#e8f5e9",
              border: "1.5px solid #4CAF50",
              borderRadius: 6,
              padding: "4px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: "#2e7d32",
              letterSpacing: 1,
            }}>
              ✓ LUNAS
            </div>
          </div>

          {/* ── Penjual / Pembeli ── */}
          <div className="rcpt-party-grid">
            <div style={{ padding: "14px 18px", background: "#fafaf8", borderRadius: 8, border: "1px solid #ede5d5" }}>
              <div style={{ fontSize: 10, letterSpacing: 1.8, color: "#C9A84C", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Penjual</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>Clemira Gold</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{SHOP_PHONE}</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{WEBSITE_URL.replace("https://", "")}</div>
            </div>
            <div style={{ padding: "14px 18px", background: "#fafaf8", borderRadius: 8, border: "1px solid #ede5d5" }}>
              <div style={{ fontSize: 10, letterSpacing: 1.8, color: "#C9A84C", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Pembeli</div>
              {tx.buyer ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{tx.buyer.name}</div>
                  {tx.buyer.phone && <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{tx.buyer.phone}</div>}
                  {tx.buyer.notes && <div style={{ fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.4 }}>{tx.buyer.notes}</div>}
                </>
              ) : (
                <div style={{ fontSize: 13, color: "#bbb", fontStyle: "italic" }}>Pembeli tidak dicatat</div>
              )}
            </div>
          </div>

          {/* ── Tabel Item ── */}
          <div className="rcpt-table-scroll">
          <table className="rcpt-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#C9A84C" }}>
                {["#", "Brand", "Series", "Gramasi", "Serial / Certcode", "Harga Jual"].map((h, i) => (
                  <th key={h} style={{ padding: "10px 12px", color: "#fff", fontWeight: 600, fontSize: 11, letterSpacing: 0.8, textAlign: i === 5 ? "right" : "left" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tx.lines.map((line, i) => {
                const unit = line.stockUnit;
                const cons = line.consignmentLine;
                const swap = line.swapEvent;
                const product = unit?.product ?? cons?.product ?? swap?.originalUnit.product;
                const serial = unit?.serialNumber ?? cons?.serialNumber ?? swap?.originalUnit.serialNumber ?? "—";
                const cert = unit?.certCode ?? cons?.certCode ?? swap?.originalUnit.certCode ?? null;

                return (
                  <tr key={line.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td className="capitalize-words" style={tdStyle}>{product?.brand ?? "—"}</td>
                    <td className="capitalize-words" style={tdStyle}>{product?.series ?? "—"}</td>
                    <td style={tdStyle}>{product ? `${product.weightGram.toNumber()} gr` : "—"}</td>
                    <td style={tdStyle}>
                      <div>{serial}</div>
                      {cert && <div style={{ fontSize: 11, color: "#999" }}>{cert}</div>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: "#222" }}>
                      {fmt(line.sellPrice.toNumber())}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f5f0e8" }}>
                <td colSpan={5} style={{ ...tdStyle, fontWeight: 700, textAlign: "right", color: "#555" }}>TOTAL</td>
                <td style={{ ...tdStyle, fontWeight: 700, textAlign: "right", fontSize: 15, color: "#C9A84C" }}>{fmt(totalSell)}</td>
              </tr>
            </tfoot>
          </table>
          </div>

          {/* ── Keterangan Pembayaran ── */}
          <div style={{ padding: "16px 18px", background: "#f0f8f0", border: "1px solid #a5d6a7", borderRadius: 8, marginBottom: 24, fontSize: 13, lineHeight: 1.7, color: "#555" }}>
            <div style={{ fontWeight: 700, color: "#2e7d32", marginBottom: 6, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
              Keterangan Pembayaran
            </div>
            <p style={{ margin: 0 }}>
              Telah diterima pembayaran sebesar <strong style={{ color: "#222" }}>{fmt(totalSell)}</strong> dari{" "}
              <strong style={{ color: "#222" }}>{tx.buyer?.name ?? "Pembeli"}</strong> pada tanggal{" "}
              <strong style={{ color: "#222" }}>{fmtDate(tx.paidAt!)}</strong> melalui transfer ke rekening{" "}
              Bank {BANK_NAME} · {BANK_NUMBER} a.n. {BANK_HOLDER}.
            </p>
          </div>

          {/* ── Catatan ── */}
          {tx.notes && (
            <div style={{ padding: "12px 16px", background: "#fafaf8", borderRadius: 6, border: "1px solid #ede5d5", fontSize: 13, color: "#666", marginBottom: 24 }}>
              <span style={{ fontWeight: 600, color: "#888" }}>Catatan: </span>{tx.notes}
            </div>
          )}

          {/* ── Tanda Tangan & QR ── */}
          <div className="rcpt-sig-grid">
            <div style={{ textAlign: "center" }}>
              <div style={{ height: 64, borderBottom: "1px solid #ccc", marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: "#888" }}>Penerima Pembayaran</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginTop: 2 }}>Clemira Gold</div>
            </div>
            <div style={{ textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Website" width={100} height={100} style={{ display: "block", margin: "0 auto 6px" }} />
              <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>{WEBSITE_URL.replace("https://", "")}</div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: 32, textAlign: "center", fontSize: 10, color: "#ccc", borderTop: "1px solid #eee", paddingTop: 12 }}>
            Kwitansi ini digenerate otomatis oleh sistem Clemira Gold · {WEBSITE_URL.replace("https://", "")}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: "#555",
  fontSize: 13,
  verticalAlign: "top",
};
