// lib/exportData.ts
// Exports the user's transactions as a CSV file and opens the OS share
// sheet so they can save it to Files, email it, etc.
//
// Uses the new expo-file-system SDK 55 API (File, Paths classes) and
// expo-sharing for the OS share sheet.

import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";

import { api } from "./api";
import type { TransactionDoc } from "@/hooks/useTransactions";
import { useToast } from "./toast";

interface TransactionsEnvelope {
  data: TransactionDoc[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Fetch all user transactions (paginated) and export as CSV.
 * Opens the system share sheet on completion.
 */
export async function exportTransactionsCSV(): Promise<void> {
  const toast = useToast.getState();

  try {
    toast.info("Preparing export…", "Fetching your transactions");

    // Fetch all pages
    const allTxns: TransactionDoc[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const envelope = await api<TransactionsEnvelope>("/api/transactions", {
        query: { page, limit: 100 },
        envelope: true,
      });
      allTxns.push(...envelope.data);
      totalPages = envelope.pagination.totalPages;
      page++;
    }

    if (allTxns.length === 0) {
      toast.info("No transactions to export");
      return;
    }

    // Build CSV
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const rows = allTxns.map((tx) => [
      dayjs(tx.date).format("YYYY-MM-DD"),
      // Escape quotes in description for CSV safety
      `"${(tx.description ?? "").replace(/"/g, '""')}"`,
      tx.category,
      tx.type,
      tx.type === "expense" ? `-${tx.amount}` : String(tx.amount),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    // Write to cache directory using SDK 55 File API
    const filename = `money-nest-transactions-${dayjs().format("YYYY-MM-DD")}.csv`;
    const file = new File(Paths.cache, filename);
    file.write(csv);

    // Check if sharing is available (not on web)
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      toast.error("Sharing not available on this device");
      return;
    }

    // Open share sheet
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Export Transactions",
      UTI: "public.comma-separated-values-text",
    });

    toast.success(
      "Export ready",
      `${allTxns.length} transaction${allTxns.length === 1 ? "" : "s"} exported`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    toast.error("Export failed", msg);
  }
}
