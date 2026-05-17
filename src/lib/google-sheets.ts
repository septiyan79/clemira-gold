import { google, Auth } from 'googleapis';

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// Parses "20 Aug 24" → UTC Date
function parseTanggal(val: string): Date | null {
  const parts = val.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const month = MONTHS[parts[1]];
  const year = 2000 + parseInt(parts[2]);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(Date.UTC(year, month, day));
}

// Parses "759,500" → BigInt(759500)
function parseHarga(val: string): bigint | null {
  const num = parseInt(String(val).replace(/,/g, ''));
  if (isNaN(num)) return null;
  return BigInt(num);
}

export interface GoldPriceRow {
  tanggal: Date;
  gramasi: string;
  harga: bigint;
}

export async function fetchHargaFromSheets(): Promise<GoldPriceRow[]> {
  const auth = new Auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const sheetName = process.env.GOOGLE_SHEET_NAME ?? 'Sheet1';

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!B:D`,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  const rows = response.data.values ?? [];
  const result: GoldPriceRow[] = [];

  for (const row of rows) {
    const [tanggalStr, gramasiStr, hargaStr] = row;
    if (!tanggalStr || !gramasiStr || !hargaStr) continue;
    const tanggal = parseTanggal(tanggalStr);
    const harga = parseHarga(hargaStr);
    if (!tanggal || !harga) continue;
    result.push({ tanggal, gramasi: String(gramasiStr).trim(), harga });
  }

  return result;
}
