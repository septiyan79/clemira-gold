"use client";

import { useState } from "react";

export default function ShareWhatsAppButton({ invoiceNo }: { invoiceNo: string }) {
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("invoice-content");
      if (!element) return;

      // Tunggu semua gambar dalam elemen benar-benar loaded
      await Promise.all(
        Array.from(element.querySelectorAll("img")).map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((res) => { img.onload = res; img.onerror = res; })
        )
      );

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // Hitung tinggi halaman sesuai konten agar tidak ada halaman kosong
      const pdfWidth = 210; // A4 lebar dalam mm
      const imgHeightMm = (canvas.height / canvas.width) * pdfWidth;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, imgHeightMm],
      });

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeightMm);

      const fileName = `Invoice-${invoiceNo}.pdf`;
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

      // Coba Web Share API (berhasil di mobile — langsung ke WhatsApp)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Invoice ${invoiceNo}`,
          text: `Invoice ${invoiceNo} dari Clemira Gold`,
        });
      } else {
        // Fallback desktop: download PDF lalu buka WhatsApp Web
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        setTimeout(() => {
          const msg = encodeURIComponent(
            `Halo, berikut Invoice ${invoiceNo} dari Clemira Gold. File PDF telah diunduh, silakan cek di folder Downloads Anda.`
          );
          window.open(`https://wa.me/?text=${msg}`, "_blank");
        }, 800);
      }
    } catch (err) {
      console.error("Gagal generate PDF:", err);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      style={{
        padding: "8px 16px",
        background: loading ? "rgba(255,255,255,0.06)" : "rgba(37,211,102,0.12)",
        color: loading ? "#888" : "#25D366",
        border: `1px solid ${loading ? "rgba(255,255,255,0.1)" : "rgba(37,211,102,0.4)"}`,
        borderRadius: 7,
        fontWeight: 600,
        fontSize: 13,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 7,
        transition: "all 0.2s",
        letterSpacing: 0.2,
      }}
    >
      {loading ? (
        <>
          <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Membuat PDF...
        </>
      ) : (
        <>
          <WhatsAppIcon />
          Share ke WhatsApp
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
