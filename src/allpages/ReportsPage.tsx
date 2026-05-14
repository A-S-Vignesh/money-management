// allpages/ReportsPage.tsx
"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Download,
  PiggyBank,
  PieChart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RPieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useReports, type ReportTimePoint } from "@/hooks/reports/useReports";
import { formatCurrency } from "@/utils/formatCurrency";

// ─── Period presets ──────────────────────────────────────────────────
type Preset = "thisMonth" | "lastMonth" | "last3Months" | "thisYear" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "thisYear", label: "This Year" },
  { value: "custom", label: "Custom" },
];

function ymd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function rangeForPreset(p: Preset): { startDate: string; endDate: string } {
  const now = new Date();
  if (p === "thisMonth") {
    return {
      startDate: ymd(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: ymd(now),
    };
  }
  if (p === "lastMonth") {
    return {
      startDate: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      endDate: ymd(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  if (p === "last3Months") {
    return {
      startDate: ymd(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
      endDate: ymd(now),
    };
  }
  // thisYear
  return {
    startDate: ymd(new Date(now.getFullYear(), 0, 1)),
    endDate: ymd(now),
  };
}

// ─── Category color map (kept consistent with rest of app) ──────────
const CATEGORY_HEX: Record<string, string> = {
  Food: "#ef4444",
  Housing: "#3b82f6",
  Transport: "#22c55e",
  Lifestyle: "#a855f7",
  Shopping: "#eab308",
  Learning: "#6366f1",
  Personal: "#ec4899",
  Salary: "#10b981",
  Transfer: "#94a3b8",
  Other: "#6b7280",
};
const FALLBACK_HEX = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4"];
const colorFor = (cat: string, idx: number) =>
  CATEGORY_HEX[cat] || FALLBACK_HEX[idx % FALLBACK_HEX.length];

// ─── Skeleton ────────────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-gray-100" />
        ))}
      </div>
      <div className="h-72 bg-white rounded-xl border border-gray-100" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-white rounded-xl border border-gray-100" />
        <div className="h-72 bg-white rounded-xl border border-gray-100" />
      </div>
    </div>
  );
}

// ─── CSV export ──────────────────────────────────────────────────────
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? "");
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ─── Main Component ──────────────────────────────────────────────────
export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>("thisMonth");
  const initial = useMemo(() => rangeForPreset("thisMonth"), []);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);

  const handlePresetChange = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") {
      const r = rangeForPreset(p);
      setStartDate(r.startDate);
      setEndDate(r.endDate);
    }
  };

  const { data, isLoading, isError, error, refetch } = useReports({
    startDate,
    endDate,
    compare: true,
  });

  const trendData = useMemo<ReportTimePoint[]>(
    () => data?.timeSeries ?? [],
    [data?.timeSeries],
  );
  const trendHasActivity = useMemo(
    () => trendData.some((p) => p.income > 0 || p.expense > 0),
    [trendData],
  );

  const expensePieData = useMemo(
    () =>
      (data?.byCategory.expense ?? []).map((c, i) => ({
        name: c.category,
        value: c.amount,
        color: colorFor(c.category, i),
      })),
    [data?.byCategory.expense],
  );

  const accountChartData = useMemo(
    () =>
      (data?.byAccount ?? []).slice(0, 8).map((a) => ({
        name: a.name.length > 12 ? `${a.name.slice(0, 12)}…` : a.name,
        fullName: a.name,
        income: a.income,
        expense: a.expense,
      })),
    [data?.byAccount],
  );

  const exportSummaryCsv = () => {
    if (!data) return;
    const rows: (string | number)[][] = [
      ["Money Nest Report"],
      ["Period", `${startDate} to ${endDate}`],
      ["Generated", new Date().toISOString()],
      [],
      ["Summary"],
      ["Metric", "Value"],
      ["Income", data.summary.income],
      ["Expense", data.summary.expense],
      ["Net", data.summary.net],
      ["Savings Rate (%)", data.summary.savingsRate],
      ["Total Transactions", data.summary.totalTransactions],
      [],
      ["Time Series"],
      ["Period", "Income", "Expense", "Net"],
      ...data.timeSeries.map((t) => [t.label, t.income, t.expense, t.net]),
      [],
      ["Expenses by Category"],
      ["Category", "Amount", "Count", "Percentage"],
      ...data.byCategory.expense.map((c) => [
        c.category,
        c.amount,
        c.count,
        c.percentage,
      ]),
      [],
      ["Income by Category"],
      ["Category", "Amount", "Count", "Percentage"],
      ...data.byCategory.income.map((c) => [
        c.category,
        c.amount,
        c.count,
        c.percentage,
      ]),
      [],
      ["Top Expenses"],
      ["Date", "Description", "Category", "Amount"],
      ...data.topExpenses.map((t) => [
        new Date(t.date).toLocaleDateString("en-IN"),
        t.description,
        t.category,
        t.amount,
      ]),
      [],
      ["Top Incomes"],
      ["Date", "Description", "Category", "Amount"],
      ...data.topIncomes.map((t) => [
        new Date(t.date).toLocaleDateString("en-IN"),
        t.description,
        t.category,
        t.amount,
      ]),
    ];
    downloadCsv(`money-nest-report_${startDate}_${endDate}.csv`, rows);
  };

  // ── Error state ──────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to load report
        </h2>
        <p className="text-gray-500 mb-4">
          {(error as Error)?.message || "Something went wrong"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            {data?.window.startDate
              ? `${new Date(data.window.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} → ${new Date(data.window.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
              : "Pick a period to see insights"}
          </p>
        </div>
        <button
          onClick={exportSummaryCsv}
          disabled={!data}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* ── Period filter bar ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePresetChange(p.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                preset === p.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
              <Calendar size={12} />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset("custom");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
              <Calendar size={12} />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={ymd(new Date())}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset("custom");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <ReportSkeleton />
      ) : !data ? null : (
        <>
          {/* ── Summary cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <SummaryCard
              tone="green"
              icon={<ArrowUpRight size={18} className="text-green-600" />}
              label="Income"
              value={formatCurrency(data.summary.income)}
              meta={`${data.summary.incomeCount} txn`}
              delta={data.comparison?.deltas.income ?? null}
              deltaGoodIfPositive
            />
            <SummaryCard
              tone="red"
              icon={<ArrowDownRight size={18} className="text-red-600" />}
              label="Expense"
              value={formatCurrency(data.summary.expense)}
              meta={`${data.summary.expenseCount} txn`}
              delta={data.comparison?.deltas.expense ?? null}
              deltaGoodIfPositive={false}
            />
            <SummaryCard
              tone="blue"
              icon={<TrendingUp size={18} className="text-blue-600" />}
              label="Net"
              value={`${data.summary.net >= 0 ? "+" : "-"}${formatCurrency(Math.abs(data.summary.net))}`}
              valueClass={data.summary.net >= 0 ? "text-blue-600" : "text-red-600"}
              delta={data.comparison?.deltas.net ?? null}
              deltaGoodIfPositive
            />
            <SummaryCard
              tone="purple"
              icon={<PiggyBank size={18} className="text-purple-600" />}
              label="Savings Rate"
              value={`${data.summary.savingsRate.toFixed(1)}%`}
              meta={
                data.comparison
                  ? `${data.comparison.deltas.savingsRate >= 0 ? "+" : ""}${data.comparison.deltas.savingsRate} pp vs prev`
                  : undefined
              }
            />
          </div>

          {/* ── Trend chart ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Income vs Expense Trend
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.window.bucketUnit === "day"
                    ? "Daily totals"
                    : data.window.bucketUnit === "week"
                      ? "Weekly totals"
                      : "Monthly totals"}
                </p>
              </div>
              <ChartLegend />
            </div>

            {trendHasActivity ? (
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="rep-income" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rep-expense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rep-net" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      interval="preserveStartEnd"
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(v: number) =>
                        Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                      }
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                      formatter={(val: number, name: string) => [
                        formatCurrency(val),
                        name.charAt(0).toUpperCase() + name.slice(1),
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#rep-income)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#rep-expense)"
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#rep-net)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart
                icon={<TrendingUp className="text-gray-400" size={36} />}
                message="No income or expense in this period"
              />
            )}
          </div>

          {/* ── Two-col: Categories + By account ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Expense categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Expenses by Category
              </h2>
              {expensePieData.length > 0 ? (
                <>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie
                          data={expensePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {expensePieData.map((entry, i) => (
                            <Cell key={`s-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            fontSize: 12,
                          }}
                          formatter={(v: number) => formatCurrency(v)}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 mt-4">
                    {data.byCategory.expense.slice(0, 5).map((c, i) => (
                      <div key={c.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: colorFor(c.category, i) }}
                            />
                            <span className="text-gray-700 truncate">
                              {c.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({c.count})
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 shrink-0 ml-3">
                            {formatCurrency(c.amount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${c.percentage}%`,
                              backgroundColor: colorFor(c.category, i),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyChart
                  icon={<PieChart className="text-gray-400" size={32} />}
                  message="No expenses in this period"
                />
              )}
            </div>

            {/* By account */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Activity by Account
              </h2>
              {accountChartData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={accountChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                      barCategoryGap={12}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f3f4f6"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickFormatter={(v: number) =>
                          Math.abs(v) >= 1000
                            ? `${(v / 1000).toFixed(1)}k`
                            : `${v}`
                        }
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#374151" }}
                        width={90}
                      />
                      <Tooltip
                        cursor={{ fill: "#f9fafb" }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
                        }}
                        formatter={(v: number, name: string) => [
                          formatCurrency(v),
                          name.charAt(0).toUpperCase() + name.slice(1),
                        ]}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullName || ""
                        }
                      />
                      <Legend
                        verticalAlign="top"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11 }}
                      />
                      <Bar dataKey="income" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart
                  icon={<Wallet className="text-gray-400" size={32} />}
                  message="No account activity in this period"
                />
              )}
            </div>
          </div>

          {/* ── Top transactions ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <TopList
              title="Top Expenses"
              tone="red"
              items={data.topExpenses}
              empty="No expenses in this period"
            />
            <TopList
              title="Top Incomes"
              tone="green"
              items={data.topIncomes}
              empty="No income in this period"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SummaryCard({
  tone,
  icon,
  label,
  value,
  meta,
  delta,
  deltaGoodIfPositive,
  valueClass,
}: {
  tone: "green" | "red" | "blue" | "purple";
  icon: React.ReactNode;
  label: string;
  value: string;
  meta?: string;
  delta?: number | null;
  deltaGoodIfPositive?: boolean;
  valueClass?: string;
}) {
  const toneBg =
    tone === "green"
      ? "bg-green-100"
      : tone === "red"
        ? "bg-red-100"
        : tone === "blue"
          ? "bg-blue-100"
          : "bg-purple-100";

  const valueColor =
    valueClass ||
    (tone === "green"
      ? "text-green-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "blue"
          ? "text-blue-600"
          : "text-purple-600");

  let deltaBadge: React.ReactNode = null;
  if (delta !== undefined && delta !== null) {
    const isPositive = delta >= 0;
    const isGood =
      deltaGoodIfPositive === undefined
        ? null
        : deltaGoodIfPositive
          ? isPositive
          : !isPositive;
    const colorCls =
      isGood === null
        ? "text-gray-500 bg-gray-100"
        : isGood
          ? "text-green-600 bg-green-50"
          : "text-red-600 bg-red-50";
    deltaBadge = (
      <span
        className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded ${colorCls}`}
      >
        {isPositive ? "+" : ""}
        {delta}%
      </span>
    );
  }

  return (
    <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className={`${toneBg} p-2 rounded-lg`}>{icon}</div>
        {deltaBadge}
      </div>
      <p className="text-xs md:text-sm text-gray-500 font-medium mb-1">
        {label}
      </p>
      <p className={`text-lg md:text-2xl font-bold truncate ${valueColor}`}>
        {value}
      </p>
      {meta && <p className="text-[11px] text-gray-400 mt-1">{meta}</p>}
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <span className="flex items-center gap-1">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
        Income
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
        Expense
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
        Net
      </span>
    </div>
  );
}

function EmptyChart({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg h-56 flex flex-col items-center justify-center">
      {icon}
      <p className="text-gray-500 text-sm mt-2">{message}</p>
    </div>
  );
}

function TopList({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: "green" | "red";
  items: {
    _id: string;
    description: string;
    category: string;
    amount: number;
    date: string;
  }[];
  empty: string;
}) {
  const toneText = tone === "green" ? "text-green-600" : "text-red-600";
  const toneBg = tone === "green" ? "bg-green-50" : "bg-red-50";
  const Sign = tone === "green" ? "+" : "-";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      {items.length === 0 ? (
        <EmptyChart
          icon={
            tone === "green" ? (
              <ArrowUpRight className="text-gray-400" size={32} />
            ) : (
              <ArrowDownRight className="text-gray-400" size={32} />
            )
          }
          message={empty}
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((t) => (
            <div
              key={t._id}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`shrink-0 w-9 h-9 rounded-lg ${toneBg} flex items-center justify-center`}
                >
                  {tone === "green" ? (
                    <ArrowUpRight className={toneText} size={16} />
                  ) : (
                    <ArrowDownRight className={toneText} size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {t.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                    {" · "}
                    {t.category}
                  </p>
                </div>
              </div>
              <span className={`font-semibold shrink-0 ${toneText}`}>
                {Sign}
                {formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
