import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PurchaseInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      lines: {
        include: {
          stockUnit: { include: { product: true, owner: true } },
        },
      },
    },
  });

  if (!po) notFound();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .adm-sidebar { display: none !important; }
          .adm-body { margin-left: 0 !important; }
          .adm-body > header { display: none !important; }
          .adm-layout { height: auto !important; overflow: visible !important; }
          .adm-main { padding: 0 !important; overflow: visible !important; }
          body { background: #fff !important; }
          .invoice-wrap { padding: 0 !important; }
        }
      `}</style>

      <div
        className="invoice-wrap"
        style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px", fontFamily: "sans-serif" }}
      >
        {/* Print button */}
        <div className="no-print" style={{ marginBottom: 24, display: "flex", justifyContent: "flex-end" }}>
          <PrintButton label="Cetak Bukti Pembelian" />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#C9A84C", letterSpacing: 1 }}>
              CLEMIRA GOLD
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Toko Emas Terpercaya</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#333" }}>BUKTI PEMBELIAN</div>
            <div style={{ fontSize: 14, color: "#C9A84C", fontWeight: 600, marginTop: 2 }}>
              {po.invoiceNo ?? "—"}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {fmtDate(po.purchasedAt)}
            </div>
          </div>
        </div>

        {/* Supplier info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 32,
            padding: "16px 20px",
            background: "#fafaf8",
            borderRadius: 8,
            border: "1px solid #e8e0d0",
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>
              Pembeli
            </div>
            <div style={{ fontWeight: 600, color: "#333" }}>Clemira Gold</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>
              Penjual
            </div>
            <div style={{ fontWeight: 600, color: "#333" }}>{po.supplier.name}</div>
            {po.supplier.phone && (
              <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{po.supplier.phone}</div>
            )}
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ background: "#f5f0e8" }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Produk</th>
              <th style={thStyle}>Serial / Sertif</th>
              <th style={thStyle}>Tahun</th>
              <th style={thStyle}>Kondisi</th>
              <th style={thStyle}>Pemilik</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Harga Beli</th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((line, i) => (
              <tr key={line.id}>
                <td style={tdStyle}>{i + 1}</td>
                <td style={tdStyle}>
                  <div style={{ color: "#333", fontWeight: 500 }}>{line.stockUnit.product.name}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>
                    {line.stockUnit.product.weightGram.toNumber()}g · {line.stockUnit.product.brand ?? ""}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div>{line.stockUnit.serialNumber ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{line.stockUnit.certCode ?? ""}</div>
                </td>
                <td style={tdStyle}>{line.stockUnit.mintYear ?? "—"}</td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#f0ebe0", color: "#7a6a4a" }}>
                    {line.stockUnit.condition === "new" ? "Baru" : "Bekas"}
                  </span>
                </td>
                <td style={tdStyle}>{line.stockUnit.owner.name}</td>
                <td style={{ ...tdStyle, textAlign: "right", color: "#333", fontWeight: 500 }}>
                  {fmt(line.unitPrice.toNumber())}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
          <div style={{ minWidth: 260 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 20px",
                background: "#C9A84C",
                borderRadius: 8,
                color: "#fff",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 15 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{fmt(po.totalAmount.toNumber())}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {po.notes && (
          <div style={{ padding: "12px 16px", background: "#fafaf8", borderRadius: 6, border: "1px solid #e8e0d0", fontSize: 13, color: "#666" }}>
            <strong>Catatan:</strong> {po.notes}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: "center", fontSize: 11, color: "#bbb", borderTop: "1px solid #eee", paddingTop: 16 }}>
          Dokumen ini digenerate secara otomatis oleh sistem Clemira Gold
        </div>
      </div>
    </>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 11,
  letterSpacing: 1,
  color: "#5A5045",
  textTransform: "uppercase" as const,
  textAlign: "left" as const,
  fontWeight: 600,
};
const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  color: "#666",
  borderBottom: "1px solid #f0ebe0",
  fontSize: 13,
  verticalAlign: "top",
};
