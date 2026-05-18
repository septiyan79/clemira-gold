export type BadgeType = "flash" | "hot" | "available" | "exclusive";

export interface PromoProduct {
  id: number;
  badge: string;
  badgeType: BadgeType;
  name: string;
  gramasi: string;
  hargaJual: number;
  hargaNormal: number;
  diskon: number;
  stok: number;
  kondisi: string;
  desc: string;
  tag: string[];
}

export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export const PRODUCTS: PromoProduct[] = [
  {
    id: 1,
    badge: "FLASH SALE",
    badgeType: "flash",
    name: "Antam 0.5g Certicard",
    gramasi: "0.5",
    hargaJual: 648_000,
    hargaNormal: 672_000,
    diskon: 4,
    stok: 5,
    kondisi: "Mulus",
    desc: "Emas batangan bersertifikat Antam 0.5 gram. Redmark, kulit ari lengkap, kondisi mulus — cocok untuk investasi perdana.",
    tag: ["Bersertifikat", "Redmark", "Kulit Ari Lengkap"],
  },
  {
    id: 2,
    badge: "HOT DEAL",
    badgeType: "hot",
    name: "Antam 1g Certicard",
    gramasi: "1",
    hargaJual: 1_285_000,
    hargaNormal: 1_340_000,
    diskon: 4,
    stok: 10,
    kondisi: "Mulus",
    desc: "Emas batangan bersertifikat Antam 1 gram. Redmark, kulit ari lengkap — ukuran paling populer untuk investasi rutin.",
    tag: ["Bersertifikat", "Redmark", "Populer"],
  },
  {
    id: 3,
    badge: "TERSEDIA",
    badgeType: "available",
    name: "Antam 2g Certicard",
    gramasi: "2",
    hargaJual: 2_550_000,
    hargaNormal: 2_640_000,
    diskon: 3,
    stok: 4,
    kondisi: "Mulus",
    desc: "Emas batangan bersertifikat Antam 2 gram. Redmark, kulit ari lengkap — nilai lebih besar, pertumbuhan lebih optimal.",
    tag: ["Bersertifikat", "Redmark", "Kulit Ari Lengkap"],
  },
  {
    id: 4,
    badge: "HOT DEAL",
    badgeType: "hot",
    name: "Antam 5g Certicard",
    gramasi: "5",
    hargaJual: 6_250_000,
    hargaNormal: 6_520_000,
    diskon: 4,
    stok: 3,
    kondisi: "Mulus",
    desc: "Emas batangan bersertifikat Antam 5 gram. Redmark, kulit ari lengkap — pilihan tepat untuk investasi jangka menengah.",
    tag: ["Bersertifikat", "Redmark", "Jangka Menengah"],
  },
  {
    id: 5,
    badge: "TERSEDIA",
    badgeType: "available",
    name: "Antam 10g Certicard",
    gramasi: "10",
    hargaJual: 12_350_000,
    hargaNormal: 12_800_000,
    diskon: 4,
    stok: 2,
    kondisi: "Mulus",
    desc: "Emas batangan bersertifikat Antam 10 gram. Redmark, kulit ari lengkap — investasi signifikan dengan nilai buyback tinggi.",
    tag: ["Bersertifikat", "Redmark", "Nilai Tinggi"],
  },
  {
    id: 6,
    badge: "EKSKLUSIF",
    badgeType: "exclusive",
    name: "Antam 50g Certicard",
    gramasi: "50",
    hargaJual: 60_500_000,
    hargaNormal: 63_000_000,
    diskon: 4,
    stok: 1,
    kondisi: "Mulus",
    desc: "Emas batangan bersertifikat Antam 50 gram. Redmark, kulit ari lengkap — untuk investor serius dengan horizon jangka panjang.",
    tag: ["Bersertifikat", "Redmark", "Eksklusif"],
  },
];
