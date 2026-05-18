export default function OurStory() {
  return (
    <section style={{ padding: "72px 20px" }}>
      <div className="wrap">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }} className="story-grid">

          {/* Kiri: teks */}
          <div>
            <p className="section-label" style={{ marginBottom: 14 }}>Cerita Kami</p>
            <h2 className="fd" style={{
              fontSize: "clamp(2rem,3vw,2.8rem)",
              fontWeight: 300,
              color: "#EDE8DE",
              lineHeight: 1.2,
              marginBottom: 24,
            }}>
              Berawal dari<br />
              <em style={{ color: "var(--gold)" }}>Kebutuhan Nyata</em>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 15, color: "#7A6E5F", lineHeight: 1.8 }}>
                Kami menyadari bahwa banyak masyarakat yang ingin berinvestasi emas Antam,
                namun kesulitan memantau harga secara real-time dan menemukan penjual yang bisa dipercaya.
              </p>
              <p style={{ fontSize: 15, color: "#7A6E5F", lineHeight: 1.8 }}>
                Clemira Gold lahir dari keinginan untuk menyederhanakan proses tersebut —
                menyediakan informasi harga yang akurat, kalkulator buyback yang transparan,
                dan akses langsung ke produk emas Antam bersertifikat.
              </p>
              <p style={{ fontSize: 15, color: "#7A6E5F", lineHeight: 1.8 }}>
                Kami percaya bahwa setiap orang berhak mendapatkan akses yang mudah
                ke investasi emas yang aman, tanpa biaya tersembunyi dan tanpa kebingungan.
              </p>
            </div>
          </div>

          {/* Kanan: quote card */}
          <div style={{ position: "relative" }}>
            <div style={{
              background: "linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04))",
              border: "1px solid rgba(201,168,76,.25)",
              borderRadius: 16,
              padding: "40px 36px",
            }}>
              <div style={{
                fontSize: "5rem",
                color: "rgba(201,168,76,.3)",
                fontFamily: "serif",
                lineHeight: 1,
                marginBottom: 16,
              }}>"</div>
              <p className="fd" style={{
                fontSize: "1.5rem",
                fontWeight: 300,
                color: "#EDE8DE",
                lineHeight: 1.5,
                fontStyle: "italic",
                marginBottom: 24,
              }}>
                Emasmu, Kendalimu. Kami hanya memastikan Anda selalu tahu nilainya.
              </p>
              <div style={{
                paddingTop: 20,
                borderTop: "1px solid rgba(201,168,76,.2)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: "#1A1612",
                  fontFamily: "serif",
                  fontWeight: 700,
                }}>C</div>
                <div>
                  <p style={{ fontSize: 14, color: "#EDE8DE", fontWeight: 500 }}>Tim Clemira Gold</p>
                  <p style={{ fontSize: 12, color: "#5A5045" }}>Platform Emas Antam Terpercaya</p>
                </div>
              </div>
            </div>
            {/* Decorative shimmer border */}
            <div style={{
              position: "absolute",
              top: -1, left: -1, right: -1, bottom: -1,
              borderRadius: 17,
              background: "linear-gradient(135deg,rgba(201,168,76,.4),transparent,rgba(201,168,76,.2))",
              zIndex: -1,
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .story-grid{grid-template-columns:1fr !important;gap:40px !important}
        }
      `}</style>
    </section>
  );
}
