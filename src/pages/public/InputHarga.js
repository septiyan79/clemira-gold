import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import { onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { sanitizeDate, MIN_DATE, MAX_DATE, formatDateID } from "../../helpers/dateUtils";

const gramasiList = [0.5, 1, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000, "buyback"];

const InputHarga = () => {
  const [tanggal, setTanggal] = useState(getTodayDate());
  const [existingHarga, setExistingHarga] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Ini adalah data yang akan ditampilkan di tabel, gabungan antara existing + paste input baru
  const [hargaList, setHargaList] = useState([]);

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Ambil data existing dari firestore dan update hargaList dengan data existing
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "harga_antam_new"), where("tanggal", "==", tanggal));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existing = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        existing[data.gramasi] = data.harga;
      });
      setExistingHarga(existing);

      // Setelah data existing didapat, set hargaList ke data existing untuk tampil
      // mapping ke bentuk array {gramasi, harga} agar bisa di-render di tabel
      const existingArray = Object.entries(existing).map(([gramasi, harga]) => ({
        gramasi,
        harga: harga.toString(),
        fromFirestore: true, // tandai data dari firestore supaya bisa disable input
      }));
      setHargaList(existingArray);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [tanggal]);

  function formatRupiah(angka) {
    if (!angka) return "";
    const number = typeof angka === "string" ? angka.replace(/\D/g, "") : angka;
    return new Intl.NumberFormat("id-ID").format(number);
  }

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const rows = pasteData.trim().split(/\r?\n/);

    const parsedData = rows.map((row) => {
      const cols = row.split("\t");
      return {
        gramasi: cols[0] ? cols[0].trim() : "",
        harga: cols[1] ? cols[1].replace(/\D/g, "") : "",
        fromFirestore: false,
      };
    });

    // Tambahkan parsedData ke hargaList tanpa menimpa existing data
    // Namun jika gramasi sudah ada di hargaList (dari firestore), jangan tambahkan duplikat
    setHargaList((prev) => {
      const existingGrams = new Set(prev.map((item) => item.gramasi));
      const filteredNewData = parsedData.filter(
        (item) => item.gramasi && !existingGrams.has(item.gramasi)
      );
      return [...prev, ...filteredNewData];
    });
  };

  // Handle perubahan input (edit)
  const handleChange = (index, field, value) => {
    // Jika field harga, hapus non-digit
    if (field === "harga") {
      value = value.replace(/\D/g, "");
    }

    setHargaList((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Submit data ke firestore hanya yang dari paste / input baru (bukan data firestore)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");

    try {
      const batch = writeBatch(db);

      hargaList.forEach(({ gramasi, harga, fromFirestore }) => {
        if (!fromFirestore && gramasi && harga) {
          // Gunakan kombinasi tanggal + gramasi sebagai docID
          const docId = `${tanggal}_${gramasi}`;
          const newDocRef = doc(db, "harga_antam_new", docId);

          batch.set(newDocRef, {
            tanggal,
            gramasi: isNaN(gramasi) ? gramasi : Number(gramasi), // pastikan numeric kalau bukan "buyback"
            harga: parseInt(harga, 10),
          });

        }
      });

      await batch.commit();

      setStatus("success");

      // Setelah simpan, reload data (existingHarga dan hargaList) agar update otomatis
      // Trigger ulang useEffect dengan setTanggal (trigger dengan tanggal yang sama untuk reload)
      setTanggal((t) => t);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  // Cek apakah semua gramasi sudah diinput
  const allFilled =
    gramasiList.every((g) => Object.keys(existingHarga).includes(String(g))) &&
    Object.keys(existingHarga).length > 0;


  return (
    <section className="page-section cta">
      <div className="container">
        <div className="row">
          <div className="col-xl-9 mx-auto">
            <div className="cta-inner bg-faded text-center rounded">
              <h2 className="section-heading mb-4">
                <span className="section-heading-upper text-gold">DAILY UPDATE</span>
                <span className="section-heading-lower">INPUT HARGA</span>
              </h2>
              <hr></hr>

              <form onSubmit={handleSubmit}>


                {/* Loading */}
                {loading && (
                  <div className="text-center my-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Memuat data harga...</p>
                  </div>
                )}

                <div className="mb-3 row align-items-center">
                  {/* Kiri: Input dengan floating label */}
                  <div className="col-12 col-md-auto mb-2 mb-md-0">
                    <div className="form-floating">
                      <input
                        type="date"
                        className="form-control text-gold"
                        id="tanggalInput"
                        value={tanggal}
                        required
                        onChange={(e) => setTanggal(sanitizeDate(e.target.value, MIN_DATE))}
                        min={MIN_DATE}
                        max={MAX_DATE}
                      />
                      <label htmlFor="tanggalInput">Tanggal</label>
                    </div>
                  </div>

                  {/* Kanan: Tanggal format panjang */}
                  <div className="col-12 col-md text-md-end fw-bold text-gold">
                    {formatDateID(tanggal, { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>


                {/* Tabel input */}
                <div className="table-responsive mb-3">
                  <table className="table table-bordered text-center align-middle">
                    <thead className="bg-gold text-light">
                      <tr>
                        <th style={{ width: "25%", whiteSpace: "nowrap" }}>Gramasi</th>
                        <th style={{ width: "75%" }}>Harga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hargaList.length === 0 && (
                        <tr>
                          <td colSpan={2} className="text-muted">
                            Silakan paste data di bawah!
                          </td>
                        </tr>
                      )}
                      {/* 🔽 Sorting diterapkan di sini sebelum map */}
                      {[...hargaList]
                        .sort((a, b) => {
                          if (a.gramasi === "buyback") return 1; // buyback di paling bawah
                          if (b.gramasi === "buyback") return -1;
                          return parseFloat(a.gramasi) - parseFloat(b.gramasi); // urut kecil → besar
                        })
                        .map(({ gramasi, harga, fromFirestore }, idx) => (

                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={gramasi}
                                onChange={(e) => handleChange(idx, "gramasi", e.target.value)}
                                disabled={fromFirestore}
                              />
                            </td>
                            <td className="position-relative">
                              <div className="d-flex align-items-center justify-content-center position-relative">
                                <input
                                  type="text"
                                  className="form-control text-center"
                                  value={formatRupiah(harga)}
                                  onChange={(e) => handleChange(idx, "harga", e.target.value)}
                                  disabled={fromFirestore}
                                />
                                {fromFirestore && (
                                  <span
                                    className="position-absolute end-0 me-2 text-success"
                                    title="Tersimpan"
                                  >
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                  </span>
                                )}
                              </div>
                            </td>

                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {hargaList.length > 0 && hargaList.every((item) => item.fromFirestore) && (
                    <div className="alert alert-success mt-2 text-center">
                      Semua harga untuk tanggal ini sudah diinput.
                    </div>
                  )}

                </div>

                {/* Textarea untuk paste */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-gold">Paste Data dari Excel</label>
                  <textarea
                    className="form-control textarea-gold"
                    rows={1}
                    placeholder={
                      allFilled
                        ? "Semua harga sudah terinput"
                        : "Paste Data dari Excel disini"
                    }
                    onPaste={handlePaste}
                    disabled={allFilled}
                  />
                  <small className="text-tiny text-start d-block mt-1 text-gold">
                    <b>Contoh format: </b><br />
                    <i> 0.5 | 500.000 </i><br />
                    <i> 1   | 950.000 </i><br />
                    <i> 2   | 180.0000 </i><br />
                    <i> buyback   | 800.0000 </i><br />
                    <i> ... </i>
                  </small>
                </div>

                <div className="d-flex gap-2 justify-content-center">
                  {/* Tombol Simpan */}
                  <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={
                      loading ||
                      hargaList.length === 0 ||
                      hargaList.every((item) => item.fromFirestore)
                    }
                  >
                    <b>Simpan Harga Baru</b>
                  </button>


                  {/* Tombol Kembali */}
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => navigate("/price")}
                  >
                    Kembali
                  </button>
                </div>

              </form>

              {/* Status notifikasi */}
              {status === "loading" && (
                <div className="alert alert-info mt-3">Memuat data...</div>
              )}
              {status === "saving" && (
                <div className="alert alert-info mt-3">Menyimpan data...</div>
              )}
              {status === "success" && (
                <div className="alert alert-success mt-3">Harga berhasil disimpan!</div>
              )}
              {status === "error" && (
                <div className="alert alert-danger mt-3">
                  Gagal menyimpan data. Coba lagi.
                </div>
              )}
            </div>
          </div>
        </div>
      </div >
    </section >
  );
};

export default InputHarga;
