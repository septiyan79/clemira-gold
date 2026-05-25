"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";

const WA_NUMBERS = [
  { label: "Customer Service 1", number: "6285975459997", display: "+62 859-7545-9997" },
  { label: "Customer Service 2", number: "6281287378387", display: "+62 812-8737-8387" },
];

interface Props {
  message?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
  align?: "left" | "center";
}

export default function WhatsAppPopover({
  message = "Halo, saya ingin bertanya tentang produk emas Clemira Gold!",
  label = "☏ Hubungi Kami",
  className = "btn-gold",
  style,
  align = "left",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 10, left: r.left, width: r.width });
    }
    setOpen(o => !o);
  }

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const dropLeft = align === "center" ? pos.left + pos.width / 2 : pos.left;

  const dropdown = (
    <div ref={dropRef} style={{
      position: "fixed",
      top: pos.top,
      left: dropLeft,
      transform: align === "center" ? "translateX(-50%)" : undefined,
      background: "#221D18",
      border: "1px solid rgba(201,168,76,.3)",
      borderRadius: 10,
      padding: 6,
      zIndex: 9999,
      minWidth: 230,
      boxShadow: "0 12px 40px rgba(0,0,0,.6)",
    }}>
      <div style={{
        position: "absolute",
        top: -5,
        left: align === "center" ? "50%" : 20,
        transform: align === "center" ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)",
        width: 10,
        height: 10,
        background: "#221D18",
        borderTop: "1px solid rgba(201,168,76,.3)",
        borderLeft: "1px solid rgba(201,168,76,.3)",
      }} />

      <p style={{ fontSize: 10, letterSpacing: 2, color: "#5A5045", textTransform: "uppercase", padding: "8px 12px 6px" }}>
        Pilih nomor CS
      </p>

      {WA_NUMBERS.map(({ label: csLabel, number, display }) => (
        <a
          key={number}
          href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => setOpen(false)}
          className="wa-option"
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 7, textDecoration: "none", color: "#EDE8DE" }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(37,211,102,.15)", border: "1px solid rgba(37,211,102,.3)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{csLabel}</p>
            <p style={{ fontSize: 11, color: "#6A5E4F" }}>{display}</p>
          </div>
        </a>
      ))}

      <style>{`.wa-option{transition:background .15s}.wa-option:hover{background:rgba(201,168,76,.08)}`}</style>
    </div>
  );

  return (
    <>
      <button ref={btnRef} onClick={handleToggle} className={className} style={style}>
        {label}
      </button>
      {open && createPortal(dropdown, document.body)}
    </>
  );
}
