import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

const YearlyAm = () => {
    const [recordsHarga, setRecordsHarga] = useState([]);
    const [recordsBuyback, setRecordsBuyback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("harga");
    const [yearlyChange, setYearlyChange] = useState(null);

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const pad = (num) => String(num).padStart(2, "0");
    const navigate = useNavigate();

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    // 🟡 Ambil data harga tahunan (1 gram + buyback)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const startDate = `${year}-01-01`;
                const endDate = `${year + 1}-01-01`;

                const prevYear = year - 1;
                const prevStart = `${prevYear}-01-01`;
                const prevEnd = `${year}-01-01`;

                const qHarga = query(
                    collection(db, "harga_antam_new"),
                    where("gramasi", "==", 1),
                    where("tanggal", ">=", startDate),
                    where("tanggal", "<", endDate),
                    orderBy("tanggal", "asc")
                );

                const qBuyback = query(
                    collection(db, "harga_antam_new"),
                    where("gramasi", "==", "buyback"),
                    where("tanggal", ">=", startDate),
                    where("tanggal", "<", endDate),
                    orderBy("tanggal", "asc")
                );

                const qPrevHarga = query(
                    collection(db, "harga_antam_new"),
                    where("gramasi", "==", 1),
                    where("tanggal", ">=", prevStart),
                    where("tanggal", "<", prevEnd),
                    orderBy("tanggal", "asc")
                );

                const [snapHarga, snapBuyback, snapPrev] = await Promise.all([
                    getDocs(qHarga),
                    getDocs(qBuyback),
                    getDocs(qPrevHarga),
                ]);

                const dataHarga = snapHarga.docs.map((doc) => doc.data());
                const dataBuyback = snapBuyback.docs.map((doc) => doc.data());
                const prevHargaData = snapPrev.docs.map((doc) => doc.data());

                // 🔸 Ambil harga terakhir tiap bulan
                const getLastByMonth = (data) => {
                    const result = [];
                    for (let m = 0; m < 12; m++) {
                        const monthData = data.filter(
                            (d) => new Date(d.tanggal).getMonth() === m
                        );
                        if (monthData.length > 0) {
                            // Ambil tanggal terakhir di bulan tsb
                            const last = monthData.reduce((a, b) =>
                                new Date(a.tanggal) > new Date(b.tanggal) ? a : b
                            );
                            result.push({ month: m, ...last });
                        } else {
                            result.push({ month: m, harga: null });
                        }
                    }
                    return result;
                };

                const hargaPerMonth = getLastByMonth(dataHarga);
                const buybackPerMonth = getLastByMonth(dataBuyback);

                setRecordsHarga(hargaPerMonth);
                setRecordsBuyback(buybackPerMonth);

                // 🔸 Hitung perubahan harga tahunan
                if (prevHargaData.length > 0 && dataHarga.length > 0) {
                    const lastPrev = prevHargaData[prevHargaData.length - 1];
                    const lastCurrent = dataHarga[dataHarga.length - 1];
                    const diff = Number(lastCurrent.harga) - Number(lastPrev.harga);

                    setYearlyChange({
                        value: diff,
                        from: lastPrev.harga,
                        to: lastCurrent.harga,
                    });
                } else {
                    setYearlyChange(null);
                }

            } catch (err) {
                console.error("Gagal ambil data:", err);
            }
            setLoading(false);
        };

        fetchData();
    }, [year]);

    // 🟢 Card perubahan harga tahunan
    const renderYearlyChange = () => {
        if (!yearlyChange) return null;
        const { value } = yearlyChange;

        let color = "text-secondary";
        let icon = "bi-dash-square-fill";
        if (value > 0) {
            color = "text-success";
            icon = "bi-caret-up-square-fill";
        } else if (value < 0) {
            color = "text-danger";
            icon = "bi-caret-down-square-fill";
        }

        return (
            <div className="alert alert-light text-center shadow-sm rounded mb-4">
                <small className="text-muted fw-semibold">Perubahan Harga Tahunan</small>
                <br />
                <h5 className={`fw-bold mt-1 ${color}`}>
                    <i className={`bi ${icon} me-2`}></i>
                    {Math.abs(value).toLocaleString("id-ID")}
                </h5>
                <label className="form-label form-text mt-1">
                    <b className="text-gold">Note:</b>
                    <br />
                    <i className="text-gold">
                        Dihitung berdasarkan harga terakhir tahun dipilih dikurangi
                        harga terakhir tahun sebelumnya. Jika tahun belum berakhir,
                        harga terakhir yang tersedia akan digunakan.
                    </i>
                </label>
            </div>
        );
    };

    // 🔸 Tabel data tahunan
    const renderTable = (data, type) => (
        <div className="table-responsive">
            <table className="table table-bordered table-striped text-center">
                <thead className="bg-gold text-light">
                    <tr>
                        <th>Bulan</th>
                        <th>{type === "buyback" ? "Buyback (Rp)" : "Harga (Rp)"}</th>
                        <th>Perubahan</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => {
                        const harga = Number(item.harga) || 0;
                        let change = "-";
                        let changeClass = "text-secondary";

                        if (idx > 0 && item.harga && data[idx - 1].harga) {
                            const diff = harga - Number(data[idx - 1].harga);
                            if (diff > 0) {
                                change = `+${diff.toLocaleString("id-ID")}`;
                                changeClass = "text-success";
                            } else if (diff < 0) {
                                change = diff.toLocaleString("id-ID");
                                changeClass = "text-danger";
                            } else {
                                change = "0";
                            }
                        }

                        return (
                            <tr key={idx}>
                                <td className="text-gold fw-bold">{monthNames[item.month]}</td>
                                <td className="text-gold fw-bold">
                                    {item.harga ? harga.toLocaleString("id-ID") : "-"}
                                </td>
                                <td className={changeClass}>{change}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <section className="page-section cta">
            <div className="container">
                <div className="row">
                    <div className="col-xl-10 mx-auto">
                        <div className="cta-inner bg-faded text-center rounded">
                            <h2 className="section-heading mb-4">
                                <span className="section-heading-upper text-gold">
                                    Yearly History
                                </span>
                                <span className="section-heading-lower">Antam 1 Gram</span>
                            </h2>
                            <hr />

                            {renderYearlyChange()}

                            {/* Pilih Tahun */}
                            {/* <div className="row mb-3">
                                <div className="col-md-4 mx-auto">
                                    <input
                                        type="number"
                                        className="form-control text-center"
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value))}
                                        min="2020"
                                        max="2100"
                                    />
                                </div>
                            </div> */}

                            {/* Tab navigasi */}
                            <ul className="nav nav-pills mb-3 justify-content-center gap-2">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link fw-bold px-4 py-2 rounded-pill ${
                                            activeTab === "harga" ? "active-tab" : "inactive-tab"
                                        }`}
                                        onClick={() => setActiveTab("harga")}
                                    >
                                        Harga
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link fw-bold px-4 py-2 rounded-pill ${
                                            activeTab === "buyback" ? "active-tab" : "inactive-tab"
                                        }`}
                                        onClick={() => setActiveTab("buyback")}
                                    >
                                        Buyback
                                    </button>
                                </li>
                            </ul>

                            {/* Konten tabel */}
                            {loading ? (
                                <div>Loading data...</div>
                            ) : activeTab === "harga" ? (
                                renderTable(recordsHarga, "harga")
                            ) : (
                                renderTable(recordsBuyback, "buyback")
                            )}

                            <hr />
                            <div className="d-flex gap-2 justify-content-center">
                                <button
                                    type="button"
                                    className="btn btn-outline-gold px-4 py-2 rounded-pill shadow-sm"
                                    onClick={() => navigate("/price")}
                                >
                                    ❌ Kembali
                                </button>
                                <button
                                    className="btn btn-outline-gold px-4 py-2 rounded-pill shadow-sm"
                                    onClick={() => navigate("/monthly-price")}
                                >
                                    📅 Monthly
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default YearlyAm;