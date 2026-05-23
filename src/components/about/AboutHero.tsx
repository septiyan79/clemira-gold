import LogoSmall from "@/components/sale/LogoSmall";
import Image from "next/image";

export default function AboutHero() {
  return (
    <section style={{
      padding: "100px 20px 72px",
      background: "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(201,168,76,.14) 0%,transparent 70%),var(--dark)",
      textAlign: "center",
    }}>
      <div className="wrap">
        <div className="fu d1" style={{
          width: 64,
          height: 64,
          margin: "0 auto 24px",
          borderRadius: 16,
          background: "rgba(201,168,76,.1)",
          border: "1px solid rgba(201,168,76,.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Image src="/Logo CG.png" alt="Clemira Gold" width={32} height={32} style={{ objectFit: "contain" }} />
        </div>
        <p className="section-label fu d1" style={{ marginBottom: 16 }}>Tentang Kami</p>
        <h1 className="fd fu d2" style={{
          fontSize: "clamp(2.8rem,5vw,4.4rem)",
          fontWeight: 300,
          color: "#EDE8DE",
          lineHeight: 1.1,
          marginBottom: 20,
        }}>
          Platform Emas yang<br />
          <em style={{ color: "var(--gold)" }}>Jujur & Transparan</em>
        </h1>
        <p className="fu d3" style={{
          fontSize: 16,
          color: "#7A6E5F",
          maxWidth: 540,
          margin: "0 auto 40px",
          lineHeight: 1.8,
        }}>
          Clemira Gold hadir untuk menjawab kebutuhan masyarakat Indonesia akan platform
          pantau dan jual beli emas Antam yang transparan, mudah diakses, dan dapat dipercaya.
        </p>
        <div className="fu d4" style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { num: "2024", label: "Tahun Berdiri" },
            { num: "100%", label: "Bersertifikat Antam" },
            { num: "Jujur", label: "& Transparan" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div className="fd" style={{ fontSize: "2.2rem", fontWeight: 600, color: "var(--gold)", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 13, color: "#5A5045", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
