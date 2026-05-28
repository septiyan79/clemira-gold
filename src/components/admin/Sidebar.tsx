"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Boxes,
  List,
  PackagePlus,
  Receipt,
  FilePlus2,
  ShoppingBag,
  PackageCheck,
  ArrowRightLeft,
  AlertTriangle,
  Users,
  UserCog,
  ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type MenuItem = { href: string; icon: LucideIcon; label: string };
type SubMenuItem = { href: string; icon: LucideIcon; label: string };
type MenuGroup = {
  label: string;
  items: (MenuItem | { icon: LucideIcon; label: string; submenu: SubMenuItem[] })[];
};

// ── Menu definition ───────────────────────────────────────────────────────────
const menuGroups: MenuGroup[] = [
  {
    label: "Home",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Produk",
    items: [
      { href: "/admin/products", icon: Package, label: "List of Product" },
    ],
  },
  {
    label: "Harga Antam",
    items: [
      {
        icon: TrendingUp,
        label: "Harga",
        submenu: [
          { href: "/admin/price",         icon: Calendar,      label: "Harian"  },
          { href: "/admin/price/monthly", icon: CalendarDays,  label: "Bulanan" },
          { href: "/admin/price/yearly",  icon: CalendarCheck, label: "Tahunan" },
        ],
      },
    ],
  },
  {
    label: "Stok",
    items: [
      { href: "/admin/stock",       icon: Boxes, label: "Dashboard Stok" },
      { href: "/admin/stock/units", icon: List,  label: "Daftar Unit"    },
    ],
  },
  {
    label: "Transaksi",
    items: [
      { href: "/admin/purchases", icon: PackagePlus, label: "Pembelian" },
      { href: "/admin/sales",     icon: Receipt,     label: "Penjualan" },
      {
        icon: FilePlus2,
        label: "Catat Transaksi",
        submenu: [
          { href: "/admin/transactions/new?tab=beli",       icon: ShoppingBag,    label: "Beli Stok"         },
          { href: "/admin/transactions/new?tab=konsinyasi", icon: PackageCheck,   label: "Konsinyasi"        },
          { href: "/admin/transactions/new?tab=swap",       icon: ArrowRightLeft, label: "Swap"              },
          { href: "/admin/transactions/outstanding-swaps",  icon: AlertTriangle,  label: "Outstanding Swaps" },
        ],
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      { href: "/admin/counterparties", icon: Users,   label: "Counterparty"    },
      { href: "/admin/users",          icon: UserCog, label: "User Management" },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Harga:             pathname.startsWith("/admin/price"),
    "Catat Transaksi": pathname.startsWith("/admin/transactions"),
  });

  function toggleMenu(label: string) {
    setOpenMenus(m => ({ ...m, [label]: !m[label] }));
  }

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
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <Image src="/Logo CG.png" alt="Clemira Gold" width={24} height={24} style={{ objectFit: "contain" }} />
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
            {/* Group label */}
            <div style={{
              fontSize: "10px", letterSpacing: "2px", color: "#3A342A",
              textTransform: "uppercase", padding: "8px 20px 4px",
            }}>
              {group.label}
            </div>

            {group.items.map((item) => {
              // ── Submenu parent ──
              if ("submenu" in item) {
                const isOpen      = openMenus[item.label] ?? false;
                const isAnyActive = item.submenu.some(s => pathname.startsWith(s.href.split("?")[0]));
                const Icon        = item.icon;
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "10px 20px", fontSize: "14px",
                        color: isAnyActive || isOpen ? "var(--gold)" : "#7A6E5F",
                        background: isAnyActive ? "rgba(201,168,76,0.08)" : "transparent",
                        borderLeft: isAnyActive ? "2px solid var(--gold)" : "2px solid transparent",
                        border: "none", cursor: "pointer",
                        fontFamily: "var(--font-dm-sans), sans-serif",
                        transition: "all 0.2s", textAlign: "left",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Icon size={16} />
                        {item.label}
                      </span>
                      <ChevronDown size={13} style={{
                        transition: "transform .2s",
                        transform: isOpen ? "rotate(180deg)" : "none",
                        opacity: 0.6,
                      }} />
                    </button>

                    {/* Submenu items */}
                    {isOpen && (
                      <div style={{ borderLeft: "1px solid rgba(201,168,76,0.12)", marginLeft: "30px" }}>
                        {item.submenu.map(sub => {
                          const SubIcon              = sub.icon;
                          const [subPath, subQuery]  = sub.href.split("?");
                          const isActive             = subQuery
                            ? pathname === subPath && new URLSearchParams(subQuery).get("tab") === searchParams.get("tab")
                            : pathname === subPath;
                          return (
                            <Link key={sub.href} href={sub.href} style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "8px 16px", fontSize: "13px",
                              color: isActive ? "var(--gold)" : "#6A5E4F",
                              background: isActive ? "rgba(201,168,76,0.06)" : "transparent",
                              borderLeft: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                              textDecoration: "none", transition: "all 0.2s",
                            }}>
                              <SubIcon size={14} />
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Regular item ──
              const Icon     = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 20px", fontSize: "14px",
                  color: isActive ? "var(--gold)" : "#7A6E5F",
                  background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                  textDecoration: "none", transition: "all 0.2s",
                }}>
                  <Icon size={16} />
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
