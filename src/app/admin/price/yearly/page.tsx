"use server";

import { syncHargaAction, fullSyncHargaAction, getLatestHargaDate } from "../actions";
import { formatTanggal } from "../helpers";
import PriceView from "../PriceView";

export default async function AdminHargaTahunan() {
  const latestDate = await getLatestHargaDate();
  const formattedDate = latestDate ? formatTanggal(latestDate) : null;

  return (
    <PriceView
      title="Harga Tahunan"
      tabType="yearly"
      formattedDate={formattedDate}
      syncAction={syncHargaAction}
      fullSyncAction={fullSyncHargaAction}
    />
  );
}
