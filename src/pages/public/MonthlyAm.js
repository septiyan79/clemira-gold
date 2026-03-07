import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { formatDateID } from "../../helpers/dateUtils";

const MonthlyAm = () => {
    const [recordsHarga, setRecordsHarga] = useState([]);
    const [recordsBuyback, setRecordsBuyback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("harga");
    const [monthlyChange, setMonthlyChange] = useState(null); // 🟢 tambahan

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0 = Jan

    const pad = (num) => String(num).padStart(2, "0");
    const navigate = useNavigate();

    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    // 🔸 Fetch data bulan ini dan bulan sebelumnya
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const startDate = `${year}-${pad(month + 1)}-01`;
                const endDate = `${year}-${pad(month + 2)}-01`;

                // bulan sebelumnya
                const prevYear = month === 0 ? year - 1 : year;
                const prevMonth = month === 0 ? 11 : month - 1;
                const prevStart = `${prevYear}-${pad(prevMonth + 1)}-01`;
                const prevEnd = `${year}-${pad(month + 1)}-01`;

                const qHarga = query(
                    collection(db, "harga_antam_new"),
                    where("gramasi", "==", 1),
                    where("tanggal", ">=", startDate),
                    where("tanggal", "<", endDate)
                );

                const qBuyback = query(
                    collection(db, "harga_antam_new"),
                    where("gramasi", "==", "buyback"),
                    where("tanggal", ">=", startDate),
                    where("tanggal", "<", endDate)
                );

                // 🟢 Query harga bulan sebelumnya
                const qPrevHarga = query(
                    collection(db, "harga_antam_new"),
                    where("gramasi", "==", 1),
                    where("tanggal", ">=", prevStart),
                    where("tanggal", "<", prevEnd)
                );

                const [snapHarga, snapBuyback, snapPrev] = await Promise.all([
                    getDocs(qHarga),
                    getDocs(qBuyback),
                    getDocs(qPrevHarga),
                ]);

                let dataHarga = [];
                snapHarga.forEach((doc) => dataHarga.push(doc.data()));
                dataHarga.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

                let dataBuyback = [];
                snapBuyback.forEach((doc) => dataBuyback.push(doc.data()));
                dataBuyback.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

                let prevHargaData = [];
                snapPrev.forEach((doc) => prevHargaData.push(doc.data()));
                prevHargaData.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

                setRecordsHarga(dataHarga);
                setRecordsBuyback(dataBuyback);

                // 🟢 Hitung perubahan harga bulan ini
                if (dataHarga.length > 0 && prevHargaData.length > 0) {
                    const lastPrev = prevHargaData[prevHargaData.length - 1];
                    const lastCurrent = dataHarga[dataHarga.length - 1];

                    const diff = Number(lastCurrent.harga) - Number(lastPrev.harga);
                    setMonthlyChange({
                        value: diff,
                        from: lastPrev.harga,
                        to: lastCurrent.harga,
                    });
                } else {
                    setMonthlyChange(null);
                }

            } catch (err) {
                console.error("Gagal ambil data:", err);
            }

            setLoading(false);
        };

        fetchData();
    }, [year, month]);

    // 🔸 Komponen tabel
    const renderTable = (data, type) => (
        <div className="table-responsive">
            <table className="table table-bordered table-striped text-center">
                <thead className="bg-gold text-light">
                    <tr>
                        <th>Tanggal</th>
                        <th>{type === "buyback" ? "Buyback (Rp)" : "Harga (Rp)"}</th>
                        <th>Perubahan</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => {
                        const harga = Number(item.harga) || 0;

                        let change = null;
                        let changeClass = "text-secondary";
                        if (idx > 0) {
                            const prev = Number(data[idx - 1].harga) || 0;
                            const diff = harga - prev;
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

                        const dateObj = new Date(item.tanggal);

                        return (
                            <tr key={idx}>
                                <td className="text-gold fw-bold">
                                    {formatDateID(dateObj, {
                                        day: "numeric",
                                        month: "short",
                                        year: "2-digit",
                                    })}
                                </td>
                                <td className="text-gold fw-bold">
                                    {harga.toLocaleString("id-ID")}
                                </td>
                                <td className={changeClass}>{change ?? "-"}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    // 🔸 Komponen perubahan harga bulan ini
    const renderMonthlyChange = () => {
        if (!monthlyChange) return null;
        const { value, from, to } = monthlyChange;

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
                <small className="text-gold fw-semibold">
                    Perubahan Harga Bulan Ini
                </small>
                <br />

                <h3 className={`fw-bold mt-1 ${color}`}>
                    <i className={`bi ${icon} me-2`}></i>
                    {Math.abs(value).toLocaleString("id-ID")}
                </h3>
                <small className="text-muted">
                    (Berdasarkan harga jual 1 gram, tidak termasuk buyback)
                </small>

                <label className="form-label form-text mt-1">
                    <b className="text-gold">Note:</b>
                    <br />
                    <i className="text-gold">
                        Perubahan harga di atas ditentukan berdasarkan harga terakhir
                        bulan dipilih dikurangi harga terakhir bulan sebelumnya.
                    </i>
                </label>
            </div>
        );
    };


    return (
        <section className="page-section cta">
            <div className="container">
                <div className="row">
                    <div className="col-xl-10 mx-auto">
                        <div className="cta-inner bg-faded text-center rounded">
                            <h2 className="section-heading mb-4">
                                <span className="section-heading-upper text-gold">
                                    Monthly History
                                </span>
                                <span className="section-heading-lower">
                                    Antam 1 Gram
                                </span>
                            </h2>
                            <hr />

                            {/* 🟢 Info perubahan harga bulan ini */}
                            {renderMonthlyChange()}

                            {/* Pilih bulan & tahun */}
                            <div className="row mb-3">
                                <div className="col-md-6 text-start">
                                    <select
                                        className="form-select"
                                        value={month}
                                        onChange={(e) => setMonth(parseInt(e.target.value))}
                                    >
                                        {monthNames.map((m, i) => (
                                            <option key={i} value={i}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6 text-start">
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value))}
                                        min="2024"
                                        max="2100"
                                    />
                                </div>
                            </div>

                            {/* Tab navigasi */}
                            <ul className="nav nav-pills mb-3 justify-content-center gap-2">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link fw-bold px-4 py-2 rounded-pill ${activeTab === "harga" ? "active-tab" : "inactive-tab"
                                            }`}
                                        onClick={() => setActiveTab("harga")}
                                    >
                                        Harga
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link fw-bold px-4 py-2 rounded-pill ${activeTab === "buyback" ? "active-tab" : "inactive-tab"
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
                                recordsHarga.length > 0 ? (
                                    renderTable(recordsHarga, "harga")
                                ) : (
                                    <div className="alert alert-warning">
                                        Tidak ada data harga untuk bulan {monthNames[month]} {year}.
                                    </div>
                                )
                            ) : recordsBuyback.length > 0 ? (
                                renderTable(recordsBuyback, "buyback")
                            ) : (
                                <div className="alert alert-warning">
                                    Tidak ada data buyback untuk bulan {monthNames[month]} {year}.
                                </div>
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
                                    onClick={() => navigate("/yearly-price")}
                                >
                                    📊 Yearly
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MonthlyAm;
