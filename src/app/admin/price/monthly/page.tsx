"use server";

import { syncHargaAction, fullSyncHargaAction, getLatestHargaDate } from "../actions";
import { formatTanggal } from "../helpers";
import PriceView from "../PriceView";

export default async function AdminHargaBulanan() {
  const latestDate = await getLatestHargaDate();
  const formattedDate = latestDate ? formatTanggal(latestDate) : null;

  return (
    <PriceView
      title="Harga Bulanan"
      tabType="monthly"
      formattedDate={formattedDate}
      syncAction={syncHargaAction}
      fullSyncAction={fullSyncHargaAction}
    />
  );
}
