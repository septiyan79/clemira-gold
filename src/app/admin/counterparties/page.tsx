import { prisma } from "@/lib/prisma";
import CounterpartyTable from "./CounterpartyTable";

export const dynamic = "force-dynamic";

export default async function CounterpartiesPage() {
  const counterparties = await prisma.counterparty.findMany({
    orderBy: { name: "asc" },
  });

  const total     = counterparties.length;
  const buyers    = counterparties.filter(c => c.type.includes("buyer")    && !c.type.includes("supplier")).length;
  const suppliers = counterparties.filter(c => c.type.includes("supplier") && !c.type.includes("buyer")).length;
  const both      = counterparties.filter(c => c.type.includes("buyer")    &&  c.type.includes("supplier")).length;

  // serialize for client component (Prisma Date → plain object)
  const data = counterparties.map(c => ({
    id:    c.id,
    name:  c.name,
    type:  c.type,
    phone: c.phone,
    notes: c.notes,
  }));

  return (
    <div>
      <p className="section-label" style={{ marginBottom: 8 }}>Master Data</p>
      <div style={{ marginBottom: 28 }}>
        <h1 className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--text)" }}>
          Data Counterparty
        </h1>
        <p style={{ fontSize: 13, color: "#5A5045", marginTop: 4 }}>
          Kelola buyer, supplier, dan counterparty dengan multi-role
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total",           value: total,     color: "var(--gold)" },
          { label: "Buyer saja",      value: buyers,    color: "#C9A84C"     },
          { label: "Supplier saja",   value: suppliers, color: "#64B5F6"     },
          { label: "Buyer & Supplier",value: both,      color: "#4CAF50"     },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#5A5045", marginBottom: 6 }}>
              {label}
            </div>
            <div className="fd" style={{ fontSize: "1.6rem", fontWeight: 300, color, lineHeight: 1 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{
        background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 16, padding: 24,
      }}>
        <CounterpartyTable initial={data} />
      </div>
    </div>
  );
}
