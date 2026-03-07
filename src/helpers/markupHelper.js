import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Ambil rata-rata markup 7 hari terakhir
 * @param {number} pricePerGramIdr - harga emas dunia per gram dalam IDR
 */
export async function getAverageMarkup(pricePerGramIdr) {
  try {
    const hargaRef = collection(db, "harga_antam_new");

    // Ambil 7 hari terakhir gramasi 1
    const q = query(
      hargaRef,
      where("gramasi", "==", 1),
      orderBy("tanggal", "desc"),
      limit(7)
    );

    const snapshot = await getDocs(q);

    const markups = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.harga && typeof data.tanggal === "string") {
        markups.push(data.harga - pricePerGramIdr);
      }
    });

    if (markups.length === 0) return 0;

    const total = markups.reduce((acc, val) => acc + val, 0);
    return total / markups.length; // rata-rata markup 7 hari
  } catch (error) {
    console.error("Error menghitung rata-rata markup:", error);
    return 0;
  }
}
