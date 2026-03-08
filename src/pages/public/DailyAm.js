import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { sanitizeDate, MIN_DATE, MAX_DATE, formatDateID } from "../../helpers/dateUtils";
import { getAverageMarkup } from "../../helpers/markupHelper";


const DailyAm = () => {
  const [hargaList, setHargaList] = useState([]);
  const [buyback, setBuyback] = useState(null);
  const [tanggal, setTanggal] = useState(getTodayDate());
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null); // ⬅️ role user
  const [yesterdayBuyback, setYesterdayBuyback] = useState(null); // ⬅️ harga kemarin

  const navigate = useNavigate();
  const { user } = useAuth();

  //dropdown kalkulator
  const [isOpen, setIsOpen] = useState(false);
  const [grams, setGrams] = useState("");
  const [results, setResults] = useState(null);

  // state untuk perubahan harga dan harga prediksi
  const [priceChange, setPriceChange] = useState(null);
  const [todayPrice, setTodayPrice] = useState(null);

  // Perhitungan Prediksi antam
  const [goldUsdPerOunce, setGoldUsdPerOunce] = useState(null);
  const [usdIdr, setUsdIdr] = useState(null);
  const [goldIdr, setGoldIdr] = useState(null);
  const [error, setError] = useState(null);

  const [markup, setMarkup] = useState(0);

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getYesterday(dateStr) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 🔹 Ambil role user dari Firestore
  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setRole(userSnap.data().role);
        }
      }
    };
    fetchRole();
  }, [user]);

  // 🔹 Ambil data harga dari Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Hari ini
        const q = query(
          collection(db, "harga_antam_new"),
          where("tanggal", "==", tanggal)
        );
        const snapshot = await getDocs(q);
        const harga = [];
        let hargaBuyback = null;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.gramasi === "buyback") {
            hargaBuyback = data.harga;
          } else {
            harga.push(data);
          }
        });

        harga.sort((a, b) => a.gramasi - b.gramasi);
        setHargaList(harga);
        setBuyback(hargaBuyback);

        // Kemarin
        const yesterday = getYesterday(tanggal);
        const qYesterday = query(
          collection(db, "harga_antam_new"),
          where("tanggal", "==", yesterday)
        );
        const snapYesterday = await getDocs(qYesterday);
        let hargaBuybackYesterday = null;

        snapYesterday.forEach((doc) => {
          const data = doc.data();
          if (data.gramasi === "buyback") {
            hargaBuybackYesterday = data.harga;
          }
        });

        setYesterdayBuyback(hargaBuybackYesterday);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [tanggal]);

  // Calculate buyback ====================
  const handleCalculate = () => {
    const g = parseFloat(grams);
    if (!g || g <= 0) return;

    setResults({
      antam: buyback * g, // total harga buyback antam
      clemira: (buyback + buyback * 0.02) * g, // total harga clemira
    });
  };


  // reset kalkulator saat buyback berubah
  useEffect(() => {
    setResults(null);
    setGrams("");
  }, [buyback]);
  // Calculate buyback ===================\

  // 🔹 PERUBAHAN HARGA =========================
  useEffect(() => {
    const fetchPriceChange = async () => {
      try {
        const today = getTodayDate();

        // Ambil harga hari ini (1 gram)
        const qToday = query(
          collection(db, "harga_antam_new"),
          where("tanggal", "==", today),
          where("gramasi", "==", 1)
        );
        const snapToday = await getDocs(qToday);

        let hargaHariIni = null;
        snapToday.forEach((doc) => {
          hargaHariIni = doc.data().harga;
        });

        // Jika data hari ini belum ada → ambil tanggal terakhir yang tersedia
        if (!hargaHariIni) {
          const qLast = query(
            collection(db, "harga_antam_new"),
            where("gramasi", "==", 1)
          );
          const snapAll = await getDocs(qLast);
          const allData = [];

          snapAll.forEach((doc) => {
            const d = doc.data();
            allData.push({
              tanggal: d.tanggal,
              harga: d.harga,
            });
          });

          if (allData.length > 0) {
            // Sort by tanggal descending
            allData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            hargaHariIni = allData[0].harga; // ambil harga terbaru
          }
        }

        // Ambil harga kemarin
        const yDate = getYesterday(today);
        const qYesterday = query(
          collection(db, "harga_antam_new"),
          where("tanggal", "==", yDate),
          where("gramasi", "==", 1)
        );
        const snapYesterday = await getDocs(qYesterday);

        let hargaKemarin = null;
        snapYesterday.forEach((doc) => {
          hargaKemarin = doc.data().harga;
        });

        // Jika harga hari ini tetap null, jangan error
        if (hargaHariIni != null && hargaKemarin != null) {
          setTodayPrice(hargaHariIni);
          setPriceChange(hargaHariIni - hargaKemarin);
        } else {
          console.warn("Data harga belum lengkap untuk perbandingan prediksi.");
        }
      } catch (err) {
        console.error("Gagal ambil perubahan harga:", err);
      }
    };

    fetchPriceChange();
  }, []);
  // 🔹 PERUBAHAN HARGA =========================\


  // 🔹 PREDIKSI HARGA ANTAM =================================
  const FREE_GOLD_API_KEY = "goldapi-7ohhqxsmgmy6axx-io";
  useEffect(() => {
    const fetchPrediksiHarga = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const docRef = doc(db, "daily_goldapi", today);
        const docSnap = await getDoc(docRef);

        let pricePerGramUsd, kursUsdIdr, pricePerGramIdr;

        if (docSnap.exists()) {
          // 🔹 Jika data hari ini sudah ada di Firestore → gunakan itu
          console.log("✅ Data GoldAPI sudah ada di Firestore");
          const saved = docSnap.data();
          pricePerGramUsd = saved.pricePerGramUsd;
          kursUsdIdr = saved.kursUsdIdr;
          pricePerGramIdr = saved.pricePerGramIdr;
        } else {
          // 🔹 Jika belum ada → fetch baru dari GoldAPI.io
          console.log("🌍 Fetch data baru dari GoldAPI.io");

          // 1. Ambil harga emas dunia per gram (USD)
          const goldRes = await fetch("https://www.goldapi.io/api/XAU/USD", {
            headers: { "x-access-token": FREE_GOLD_API_KEY },
          });
          if (!goldRes.ok) throw new Error("Gagal ambil harga emas dunia");
          const goldData = await goldRes.json();

          pricePerGramUsd = goldData.price_gram_24k;
          if (!pricePerGramUsd) throw new Error("Data harga emas tidak ditemukan");

          // 2. Ambil kurs USD/IDR
          const fxRes = await fetch("https://open.er-api.com/v6/latest/USD");
          if (!fxRes.ok) throw new Error("Gagal ambil kurs USD/IDR");
          const fxData = await fxRes.json();
          kursUsdIdr = fxData.rates.IDR;

          // 3. Konversi ke IDR per gram
          pricePerGramIdr = pricePerGramUsd * kursUsdIdr;

          // 🔹 Simpan hasil ke Firestore agar tidak fetch lagi hari ini
          await setDoc(docRef, {
            date: today,
            pricePerGramUsd,
            kursUsdIdr,
            pricePerGramIdr,
            createdAt: Date.now(),
          });
          console.log("💾 Data disimpan ke Firestore:", today);
        }

        // 4. Hitung markup rata-rata
        let avgMarkup = await getAverageMarkup(pricePerGramIdr);
        if (!avgMarkup || isNaN(avgMarkup)) avgMarkup = 160000;

        setMarkup(Math.round(avgMarkup));

        // 5. Simpan ke state untuk ditampilkan
        setGoldUsdPerOunce(pricePerGramUsd * 31.1035);
        setUsdIdr(kursUsdIdr);
        setGoldIdr(pricePerGramIdr + avgMarkup);

        // CONTOH:
        // harga dunia (IDR) : 1,154,400
        // markup Antam      : 160,000
        // --------------------------------
        // prediksi Antam    : 1,314,400

      } catch (err) {
        console.error("Gagal fetch prediksi harga:", err);
        setError(err.message);
        setMarkup(160000);
      }
    };

    fetchPrediksiHarga();
  }, []);

  // Hitung selisih prediksi vs harga hari ini
  const priceDiff = todayPrice && goldIdr ? goldIdr - todayPrice : null;
  const isUp = priceDiff >= 0;

  // 🔹 PREDIKSI HARGA ANTAM ================================= \


  return (
    <section className="page-section cta">
      <div className="container">
        <div className="row">
          <div className="col-xl-9 mx-auto">
            <div className="cta-inner bg-faded text-center rounded">
              <h2 className="section-heading mb-4">
                <span className="section-heading-upper text-gold">Daily Update</span>
                <span className="section-heading-lower">Harga Antam</span>
              </h2>
              <hr />

              {/* Pilih tanggal */}
              <div className="mb-3 row align-items-center justify-content-center justify-content-md-between text-center text-md-start">
                <div className="col-12 col-md-auto mb-2 mb-md-0">
                  <div className="form-floating">
                    <input
                      type="date"
                      className="form-control text-gold"
                      value={tanggal}
                      onChange={(e) => setTanggal(sanitizeDate(e.target.value, MIN_DATE))}
                      min={MIN_DATE}
                      max={MAX_DATE}
                    />
                    <label htmlFor="tanggalInput" className="text-muted small text-gold">
                      Pilih tanggal
                    </label>
                  </div>
                </div>
                <div className="col-12 col-md text-md-end fw-bold text-gold">
                  {formatDateID(tanggal, { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>



              {/* Tabel harga */}
              {loading ? (
                <div className="text-center my-4">Loading data...</div>
              ) : hargaList.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped text-center">
                    <thead className="bg-gold text-light">
                      <tr>
                        <th>Gramasi</th>
                        <th>Harga (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hargaList.map((item, index) => (
                        <tr key={index}>
                          <td className="text-gold fw-bold">{item.gramasi} gr</td>
                          <td className="text-gold fw-bold">{item.harga.toLocaleString("id-ID")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-warning text-center">
                  Tidak ada data harga untuk tanggal {tanggal}.
                </div>
              )}

              {/* Buyback */}
              {buyback && (
                <div
                  className="alert text-center border-0 shadow-sm"
                  style={{
                    backgroundColor: "rgba(255, 217, 0, 0.25)", // gold lembut transparan
                    border: "1px solid rgba(255, 215, 0, 0.4)",
                    color: "#b68b1dff",
                  }}
                >
                  <small className="fw-bold">Buyback 1 g</small>
                  <br />
                  <h5 className="text-gold">Rp {buyback.toLocaleString("id-ID")}</h5>
                  <label className="form-label form-text text-gold">
                    {formatDateID(tanggal, { day: "numeric", month: "long", year: "numeric" })}
                  </label>
                  <hr className="border-gold opacity-50" />

                  <p className="mt-2">
                    <button
                      className="btn btn-gold btn-sm"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#buybackCalc"
                      aria-expanded={isOpen}
                      aria-controls="buybackCalc"
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      {isOpen ? "Tutup Kalkulator Buyback" : "Buka Kalkulator Buyback"}
                    </button>
                  </p>

                  <div className="collapse" id="buybackCalc">
                    <div
                      className="card card-body border-0 shadow-sm"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                      }}
                    >
                      <div className="row justify-content-center">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <input
                              type="number"
                              className="form-control text-center"
                              value={grams}
                              min={1}
                              onChange={(e) => setGrams(e.target.value)}
                              placeholder="Masukkan gramasi"
                            />

                            <label className="form-label form-text">
                              <i>Jumlah Gram</i>
                            </label>
                          </div>
                          <button className="btn btn-gold w-30" onClick={handleCalculate}>
                            Hitung
                          </button>
                        </div>
                      </div>

                      {results && (
                        <div className="row mt-3 g-2">
                          {/* BUYBACK ANTAM */}
                          <div className="col-md-6">
                            <div
                              className="card h-100 shadow-sm border-0"
                              style={{
                                backgroundColor: "rgba(255, 217, 0, 0.25)",
                              }}
                            >
                              <div className="card-body">
                                <h6 className="fw-bold text-gold text-center mb-3">
                                  Buyback Antam
                                </h6>

                                {/* Hitung nilai dasar */}
                                {(() => {
                                  const harga = results.antam;
                                  const pph = harga > 10000000 ? harga * 0.015 : 0;
                                  const meterai = harga > 5000000 ? 10000 : 0;
                                  const total = harga - pph - meterai;

                                  return (
                                    <table className="table table-sm table-borderless mb-0">
                                      <tbody>
                                        <tr>
                                          <td className="text-start">Harga ({grams} gr)</td>
                                          <td className="text-end">
                                            Rp {harga.toLocaleString("id-ID")}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="text-start">
                                            PPh 22{" "}
                                            {harga > 10000000 ? (
                                              <small className="text-muted">(1.5%)</small>
                                            ) : (
                                              <small className="text-muted">(0%)</small>
                                            )}
                                          </td>
                                          <td className="text-end text-danger">
                                            - Rp {pph.toLocaleString("id-ID")}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="text-start">
                                            Meterai{" "}
                                            {harga > 5000000 ? (
                                              <small className="text-muted">(≥ 5 jt)</small>
                                            ) : (
                                              <small className="text-muted">(0)</small>
                                            )}
                                          </td>
                                          <td className="text-end text-danger">
                                            - Rp {meterai.toLocaleString("id-ID")}
                                          </td>
                                        </tr>
                                        <tr className="border-top fw-bold">
                                          <td className="text-start text-gold">Harga Total</td>
                                          <td className="text-end text-gold">
                                            Rp {total.toLocaleString("id-ID")}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* BUYBACK CLEMIRA */}
                          <div className="col-md-6">
                            <div
                              className="card h-100 shadow-sm border-0"
                              style={{
                                backgroundColor: "rgba(255, 217, 0, 0.25)",
                              }}
                            >
                              <div className="card-body">
                                <h6 className="fw-bold text-gold text-center mb-3">
                                  Buyback Clemira Gold
                                </h6>

                                {(() => {
                                  const hargaClemira = results.clemira;
                                  const hargaAntam = results.antam;

                                  const pph = hargaAntam > 10000000 ? hargaAntam * 0.015 : 0;
                                  const meterai = hargaAntam > 5000000 ? 10000 : 0;
                                  const totalAntam = hargaAntam - pph - meterai;

                                  const selisih = hargaClemira - totalAntam;

                                  return (
                                    <table className="table table-sm table-borderless mb-0">
                                      <tbody>
                                        <tr>
                                          <td className="text-start">Harga ({grams} gr)</td>
                                          <td className="text-end">
                                            Rp {hargaClemira.toLocaleString("id-ID")}
                                          </td>
                                        </tr>

                                        <tr>
                                          <td className="text-start text-muted">PPh 22</td>
                                          <td className="text-end text-muted">Rp 0</td>
                                        </tr>

                                        <tr>
                                          <td className="text-start text-muted">Meterai</td>
                                          <td className="text-end text-muted">Rp 0</td>
                                        </tr>

                                        <tr className="border-top fw-bold">
                                          <td className="text-start text-gold">Harga Total</td>
                                          <td className="text-end text-gold">
                                            Rp {hargaClemira.toLocaleString("id-ID")}
                                          </td>
                                        </tr>

                                        {/* ROW SELISIH */}
                                        <tr className="fw-bold">
                                          <td className="text-start text-success">
                                            Selisih vs Antam
                                          </td>
                                          <td className="text-end text-success">
                                            Rp {selisih.toLocaleString("id-ID")}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  );
                                })()}
                                <br />
                                <a href="https://wa.me/6285975459997?text=Halo,%20Mau%20info%20Buyback%20Antam%20nya%20min!" target="blank" className="btn btn-sm btn-gold w-30">
                                  ☏ Hubungi Kami
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>


              )}

              <hr />

              {/* Tombol Monthly Price */}
              <div className="d-flex gap-2 justify-content-center my-3">
                {role === "admin" && (
                  <button
                    className="btn btn-outline-gold px-4 py-2 rounded-pill shadow-sm"
                    onClick={() => navigate("/input-harga")}
                  >
                    ✏️ Input
                  </button>
                )}
                <button
                  className="btn btn-outline-gold px-4 py-2 rounded-pill shadow-sm"
                  onClick={() => navigate("/monthly-price")}
                >
                  📅 Monthly
                </button>

                <button
                  className="btn btn-outline-gold px-4 py-2 rounded-pill shadow-sm"
                  onClick={() => navigate("/yearly-price")}
                >
                  📊 Yearly
                </button>
              </div>

              {/* Card Prediksi dan perubahan Harga Antam */}
              <div className="row row-cols-1 row-cols-md-2 g-3 mt-4">
                {/* Card Perubahan Harga Hari Ini */}
                <div className="col">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <h6 className="fw-bold text-gold mb-3">
                        Perubahan Harga Hari Ini
                      </h6>

                      {priceChange !== null && todayPrice !== null ? (
                        <>
                          <h3
                            className={`fw-bold d-flex justify-content-center align-items-center gap-2 mb-0 ${priceChange > 0
                              ? "text-success"
                              : priceChange < 0
                                ? "text-danger"
                                : "text-muted"
                              }`}
                          >
                            <i
                              className={`bi ${priceChange > 0
                                ? "bi-caret-up-square-fill"
                                : priceChange < 0
                                  ? "bi-caret-down-square-fill"
                                  : "bi-dash-square-fill"
                                }`}
                            ></i>
                            {priceChange === 0
                              ? "0"
                              : `Rp ${Math.abs(priceChange).toLocaleString("id-ID")}`}
                          </h3>

                          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                            Rp {todayPrice.toLocaleString("id-ID")}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted">Memuat data...</p>
                      )}
                    </div>
                  </div>
                </div>


                {/* Card Prediksi Harga Besok */}
                <div className="col">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <h6 className="fw-bold text-gold mb-3">
                        Estimasi Update Harga <br />Berikutnya
                      </h6>

                      {error && (
                        <p className="text-danger small mb-2">
                          Gagal memuat prediksi: {error}
                        </p>
                      )}

                      {goldIdr ? (
                        <>
                          <h2
                            className={`fw-bold d-flex justify-content-center align-items-center gap-2 mb-0 ${isUp ? "text-success" : "text-danger"
                              }`}
                          >
                            <i
                              className={`bi ${isUp ? "bi-caret-up-square-fill" : "bi-caret-down-square-fill"
                                }`}
                            ></i>
                            Rp {Math.abs(priceDiff).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                          </h2>

                          {/* <p className="text-muted mb-2" style={{ fontSize: "0.9rem" }}>
                            Perkiraan harga Antam 1g
                          </p> */}
                          <br />

                          <div className="small text-muted">
                            <p className="mb-1">
                              Harga emas dunia:{" "}
                              <strong>{goldUsdPerOunce ? `$${goldUsdPerOunce.toFixed(2)}` : "-"}</strong>
                            </p>
                            <p className="mb-1">
                              Kurs USD/IDR:{" "}
                              <strong>{usdIdr ? usdIdr.toLocaleString("id-ID", { maximumFractionDigits: 0 }) : "-"}</strong>
                            </p>
                            {/* <p className="mb-0">
                              Markup rata-rata:{" "}
                              <strong>{markup ? `Rp ${markup.toLocaleString("id-ID")}` : "-"}</strong>
                            </p> */}
                          </div>
                        </>
                      ) : (
                        <p className="text-muted">Menghitung prediksi...</p>
                      )}

                      {/* Catatan */}
                      <div
                        className="alert alert-warning small text-start mt-3 mb-0"
                        role="alert"
                      >
                        <strong>Catatan:</strong>
                        <ul className="mb-0 mt-1 ps-3">
                          <li>Angka di atas hanya prediksi.</li>
                          <li>Hasil tidak menjamin 100% akurat.</li>
                          <li>Keputusan perubahan sepenuhnya berada di pihak PT Antam.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default DailyAm;
