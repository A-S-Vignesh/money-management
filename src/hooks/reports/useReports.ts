import { useQuery } from "@tanstack/react-query";

export type BucketUnit = "day" | "week" | "month";

export interface ReportSummary {
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
  totalTransactions: number;
}

export interface ReportComparison {
  previous: ReportSummary;
  deltas: {
    income: number | null;
    expense: number | null;
    net: number | null;
    savingsRate: number; // absolute pp delta, not %
  };
  window: { startDate: string; endDate: string };
}

export interface ReportTimePoint {
  bucket: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface ReportCategoryRow {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ReportTopTransaction {
  _id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

export interface ReportAccountRow {
  accountId: string;
  name: string;
  type: string;
  income: number;
  expense: number;
  net: number;
}

export interface ReportData {
  window: { startDate: string; endDate: string; bucketUnit: BucketUnit };
  summary: ReportSummary;
  comparison: ReportComparison | null;
  timeSeries: ReportTimePoint[];
  byCategory: { expense: ReportCategoryRow[]; income: ReportCategoryRow[] };
  topExpenses: ReportTopTransaction[];
  topIncomes: ReportTopTransaction[];
  byAccount: ReportAccountRow[];
}

export interface UseReportsParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  compare?: boolean;
}

async function fetchReport(params: UseReportsParams): Promise<ReportData> {
  const qs = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });
  if (params.compare) qs.set("compare", "1");

  const res = await fetch(`/api/reports?${qs.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to load report");
  }
  return json.data as ReportData;
}

export function useReports(params: UseReportsParams) {
  return useQuery({
    queryKey: [
      "reports",
      params.startDate,
      params.endDate,
      params.compare ?? false,
    ],
    queryFn: () => fetchReport(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
