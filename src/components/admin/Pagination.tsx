// Pure server component — no "use client" needed; all links are <a> tags

type Props = {
  page:        number;   // current page (1-indexed)
  totalPages:  number;
  basePath:    string;   // e.g. "/admin/purchases"
  extraParams?: Record<string, string>; // preserved across page changes
};

function pageHref(basePath: string, p: number, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra);
  if (p > 1) params.set("page", String(p));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Returns an array of page numbers and "..." strings to render. */
function buildPages(page: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | "...")[] = [1];

  const lo = Math.max(2, page - 1);
  const hi = Math.min(total - 1, page + 1);

  if (lo > 2)       result.push("...");
  for (let i = lo; i <= hi; i++) result.push(i);
  if (hi < total - 1) result.push("...");

  result.push(total);
  return result;
}

export default function Pagination({ page, totalPages, basePath, extraParams }: Props) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);
  const extra = extraParams ?? {};

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 32, height: 32, padding: "0 8px",
    borderRadius: 6, fontSize: 13, textDecoration: "none",
    border: "1px solid rgba(255,255,255,.06)",
    transition: "all .15s",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingTop: 20, marginTop: 4, borderTop: "1px solid rgba(255,255,255,.05)",
      flexWrap: "wrap", gap: 12,
    }}>
      {/* Prev */}
      {page > 1 ? (
        <a href={pageHref(basePath, page - 1, extra)} style={{
          ...btnBase,
          color: "var(--gold)", background: "rgba(201,168,76,.08)",
          border: "1px solid rgba(201,168,76,.25)",
        }}>
          ← Prev
        </a>
      ) : (
        <span style={{ ...btnBase, color: "#3A342A", cursor: "default", border: "1px solid rgba(255,255,255,.03)" }}>
          ← Prev
        </span>
      )}

      {/* Page numbers */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} style={{ ...btnBase, color: "#3A342A", border: "none", cursor: "default" }}>
              …
            </span>
          ) : (
            <a key={p} href={pageHref(basePath, p, extra)} style={{
              ...btnBase,
              color:      p === page ? "#1A1612"        : "#7A6E5F",
              background: p === page ? "var(--gold)"    : "transparent",
              border:     p === page ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,.06)",
              fontWeight: p === page ? 600 : 400,
            }}>
              {p}
            </a>
          )
        )}
      </div>

      {/* Next */}
      {page < totalPages ? (
        <a href={pageHref(basePath, page + 1, extra)} style={{
          ...btnBase,
          color: "var(--gold)", background: "rgba(201,168,76,.08)",
          border: "1px solid rgba(201,168,76,.25)",
        }}>
          Next →
        </a>
      ) : (
        <span style={{ ...btnBase, color: "#3A342A", cursor: "default", border: "1px solid rgba(255,255,255,.03)" }}>
          Next →
        </span>
      )}
    </div>
  );
}
