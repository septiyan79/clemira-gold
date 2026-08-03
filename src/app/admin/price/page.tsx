"use server";

import { syncHargaAction, fullSyncHargaAction, getLatestHargaDate } from "./actions";
import { formatTanggal } from "./helpers";
import PriceView from "./PriceView";

export default async function AdminHargaHarian() {
  const latestDate = await getLatestHargaDate();
  const formattedDate = latestDate ? formatTanggal(latestDate) : null;

  return (
    <PriceView
      title="Harga Harian"
      tabType="daily"
      formattedDate={formattedDate}
      syncAction={syncHargaAction}
      fullSyncAction={fullSyncHargaAction}
    />
  );
}
