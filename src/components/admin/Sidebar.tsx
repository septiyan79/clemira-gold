"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type MenuItem = { href: string; icon: string; label: string };
type MenuGroup = {
  label: string;
  items: (MenuItem | { icon: string; label: string; submenu: MenuItem[] })[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Home",
    items: [
      { href: "/admin", icon: "⬡", label: "Dashboard" },
    ],
  },
  {
    label: "Produk",
    items: [
      { href: "/admin/products", icon: "◈", label: "List of Product" },
    ],
  },
  {
    label: "Harga Antam",
    items: [
      {
        icon: "◎",
        label: "Harga",
        submenu: [
          { href: "/admin/price",         icon: "·", label: "Harian"  },
          { href: "/admin/price/monthly", icon: "·", label: "Bulanan" },
          { href: "/admin/price/yearly",  icon: "·", label: "Tahunan" },
        ],
      },
    ],
  },
  {
    label: "User",
    items: [
      { href: "/admin/users", icon: "◉", label: "User Management" },
    ],
  },
];

export default function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const isPricePath = pathname.startsWith("/admin/price");
  const [priceOpen, setPriceOpen] = useState(isPricePath);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <aside className={`adm-sidebar${open ? " open" : ""}`}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid rgba(201,168,76,0.15)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
          <polygon points="14,2 26,9 26,21 14,26 2,21 2,9" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
          <polygon points="14,7 21,11 21,19 14,22 7,19 7,11" fill="rgba(201,168,76,.15)" stroke="#C9A84C" strokeWidth=".8" />
          <text x="14" y="17" textAnchor="middle" fontSize="8" fill="#C9A84C" fontFamily="serif" fontWeight="600">Au</text>
        </svg>
        <div>
          <div className="fd" style={{ fontSize: "15px", fontWeight: 600, color: "#EDE8DE", lineHeight: 1 }}>
            Clemira Gold
          </div>
          <div style={{ fontSize: "10px", color: "var(--muted)", letterSpacing: "1px", marginTop: "2px" }}>
            ADMIN PANEL
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
        {menuGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: "8px" }}>
            <div style={{
              fontSize: "10px",
              letterSpacing: "2px",
              color: "#3A342A",
              textTransform: "uppercase",
              padding: "8px 20px 4px",
            }}>
              {group.label}
            </div>

            {group.items.map((item) => {
              if ("submenu" in item) {
                const isAnyActive = item.submenu.some(s => pathname === s.href);
                return (
                  <div key={item.label}>
                    {/* Parent toggle */}
                    <button
                      onClick={() => setPriceOpen(o => !o)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "10px 20px",
                        fontSize: "14px",
                        color: isAnyActive || priceOpen ? "var(--gold)" : "#7A6E5F",
                        background: isAnyActive ? "rgba(201,168,76,0.08)" : "transparent",
                        borderLeft: isAnyActive ? "2px solid var(--gold)" : "2px solid transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-dm-sans), sans-serif",
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>{item.icon}</span>
                        {item.label}
                      </span>
                      <span style={{
                        fontSize: "10px",
                        transition: "transform .2s",
                        transform: priceOpen ? "rotate(180deg)" : "none",
                      }}>▼</span>
                    </button>

                    {/* Submenu */}
                    {priceOpen && (
                      <div style={{ borderLeft: "1px solid rgba(201,168,76,0.12)", marginLeft: "30px" }}>
                        {item.submenu.map(sub => {
                          const isActive = pathname === sub.href;
                          return (
                            <Link key={sub.href} href={sub.href} style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 16px",
                              fontSize: "13px",
                              color: isActive ? "var(--gold)" : "#6A5E4F",
                              background: isActive ? "rgba(201,168,76,0.06)" : "transparent",
                              borderLeft: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                              textDecoration: "none",
                              transition: "all 0.2s",
                            }}>
                              <span style={{ fontSize: "18px", lineHeight: 1 }}>{sub.icon}</span>
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  color: isActive ? "var(--gold)" : "#7A6E5F",
                  background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div style={{ fontSize: "11px", color: "#3A342A" }}>© 2026 Clemira Gold</div>
      </div>
    </aside>
  );
}
