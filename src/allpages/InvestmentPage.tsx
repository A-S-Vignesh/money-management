// allpages/InvestmentPage.tsx
"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  PieChart as PieIcon,
  Wallet,
  X,
  Loader2,
  Search,
  PiggyBank,
} from "lucide-react";
import {
  PieChart as RPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useAccounts } from "@/hooks/accounts/useAccounts";
import { useHoldings, type Holding } from "@/hooks/holdings/useHoldings";
import { usePortfolio } from "@/hooks/holdings/usePortfolio";
import {
  useCreateHolding,
  useUpdateHolding,
  useDeleteHolding,
  useBuyHolding,
  useSellHolding,
  useUpdateHoldingPrice,
} from "@/hooks/holdings/useHoldingMutations";
import {
  holdingTypes,
  holdingTypeLabels,
  type HoldingType,
} from "@/validations/holding";
import { formatCurrency } from "@/utils/formatCurrency";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import PullToRefresh from "@/components/PullToRefresh";
import { IAccount } from "@/types/account";

// ─── Color map per holding type (allocation chart) ──────────────────
const TYPE_COLORS: Record<HoldingType, string> = {
  stock: "#3b82f6",
  mutual_fund: "#8b5cf6",
  etf: "#06b6d4",
  fd: "#10b981",
  gold: "#eab308",
  ppf: "#22c55e",
  crypto: "#f97316",
  real_estate: "#ec4899",
  other: "#6b7280",
};

const todayYmd = () => new Date().toISOString().split("T")[0];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function InvestmentPage() {
  const portfolio = usePortfolio();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [typeFilter, setTypeFilter] = useState<HoldingType | "all">("all");
  const holdingsQuery = useHoldings({ includeInactive });
  const deleteHolding = useDeleteHolding();

  const { data: accountsData } = useAccounts({
    page: 1,
    limit: 100,
    includeGoals: false,
  });
  const allAccounts: IAccount[] = accountsData?.data ?? [];
  const investmentAccounts = useMemo(
    () => allAccounts.filter((a) => a.type === "investment"),
    [allAccounts],
  );
  const cashAccounts = useMemo(
    () =>
      allAccounts.filter(
        (a) =>
          a.type === "bank" || a.type === "cash" || a.type === "other",
      ),
    [allAccounts],
  );

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [buyTarget, setBuyTarget] = useState<Holding | null>(null);
  const [sellTarget, setSellTarget] = useState<Holding | null>(null);
  const [priceTarget, setPriceTarget] = useState<Holding | null>(null);
  const [editTarget, setEditTarget] = useState<Holding | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holding | null>(null);

  const filteredHoldings = useMemo(() => {
    const list = holdingsQuery.data ?? [];
    if (typeFilter === "all") return list;
    return list.filter((h) => h.type === typeFilter);
  }, [holdingsQuery.data, typeFilter]);

  const allocation = portfolio.data?.allocationByType ?? [];
  const summary = portfolio.data?.summary;
  const recentActivity = portfolio.data?.recentActivity ?? [];

  // ── Error states ──
  if (portfolio.isError) {
    return (
      <ErrorState
        message={(portfolio.error as Error)?.message}
        onRetry={() => portfolio.refetch()}
      />
    );
  }

  return (
    <PullToRefresh
      onRefresh={async () => {
        await Promise.all([portfolio.refetch(), holdingsQuery.refetch()]);
      }}
    >
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Investments</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track holdings, P&L and asset allocation
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={cashAccounts.length === 0}
          title={
            cashAccounts.length === 0 ? "Create a cash/bank account first" : ""
          }
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Add Holding
        </button>
      </div>

      {/* No investment-account preflight banner anymore. The backend
          auto-creates a default "Brokerage" account on first holding,
          so the only remaining prerequisite is a cash/bank source. */}
      {!portfolio.isLoading && cashAccounts.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">
              No cash account yet
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-sm mt-0.5">
              Add a Bank / Cash / Wallet account first — the cash side of
              your buys has to come from somewhere.
            </p>
            <Link
              href="/dashboard/balance"
              className="inline-block mt-2 text-sm font-medium text-amber-900 dark:text-amber-200 hover:underline"
            >
              Go to Balance →
            </Link>
          </div>
        </div>
      )}

      {/* ── Summary cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {portfolio.isLoading || !summary ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse"
              />
            ))}
          </>
        ) : (
          <>
            <SummaryCard
              tone="blue"
              icon={<Wallet size={18} className="text-blue-600 dark:text-blue-300" />}
              label="Total Invested"
              value={formatCurrency(summary.totalInvested)}
              meta={`${summary.activeHoldingsCount} active`}
            />
            <SummaryCard
              tone="indigo"
              icon={<TrendingUp size={18} className="text-indigo-600 dark:text-indigo-300" />}
              label="Current Value"
              value={formatCurrency(summary.currentValue)}
              meta={`${summary.holdingsCount} total`}
            />
            <SummaryCard
              tone={summary.unrealizedPnL >= 0 ? "green" : "red"}
              icon={
                summary.unrealizedPnL >= 0 ? (
                  <ArrowUpRight size={18} className="text-green-600 dark:text-green-300" />
                ) : (
                  <ArrowDownRight size={18} className="text-red-600 dark:text-red-300" />
                )
              }
              label="Unrealized P&L"
              value={`${summary.unrealizedPnL >= 0 ? "+" : "-"}${formatCurrency(Math.abs(summary.unrealizedPnL))}`}
              valueClass={
                summary.unrealizedPnL >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
              }
              meta={`${summary.unrealizedPnLPct >= 0 ? "+" : ""}${summary.unrealizedPnLPct}%`}
            />
            <SummaryCard
              tone="purple"
              icon={<PiggyBank size={18} className="text-purple-600 dark:text-purple-300" />}
              label="Realized P&L"
              value={`${summary.realizedPnL >= 0 ? "+" : "-"}${formatCurrency(Math.abs(summary.realizedPnL))}`}
              valueClass={
                summary.realizedPnL >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
              }
              meta="From sells"
            />
          </>
        )}
      </div>

      {/* ── Allocation + Holdings (2-col on desktop) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Allocation pie */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Asset Allocation
          </h2>
          {portfolio.isLoading ? (
            <div className="h-56 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : allocation.length > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {allocation.map((slice, i) => (
                        <Cell
                          key={`s-${i}`}
                          fill={
                            TYPE_COLORS[slice.type as HoldingType] || "#6b7280"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                      formatter={(v) => formatCurrency(Number(v))}
                      labelFormatter={(label) =>
                        holdingTypeLabels[label as HoldingType] || String(label)
                      }
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value: string) =>
                        holdingTypeLabels[value as HoldingType] || value
                      }
                    />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {allocation.slice(0, 5).map((a) => (
                  <div
                    key={a.type}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            TYPE_COLORS[a.type as HoldingType] || "#6b7280",
                        }}
                      />
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {holdingTypeLabels[a.type as HoldingType] || a.type}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({a.count})
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(a.value)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{a.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyBlock
              icon={<PieIcon size={32} className="text-gray-400 dark:text-gray-500" />}
              message="No active holdings yet"
            />
          )}
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Recent Investment Activity
            </h2>
            <Link
              href="/dashboard/transactions"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-800"
            >
              View All
            </Link>
          </div>
          {portfolio.isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <EmptyBlock
              icon={<RefreshCw size={32} className="text-gray-400 dark:text-gray-500" />}
              message="No buys, sells or dividends yet"
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((t) => {
                const isBuy = t.category === "Investment Buy";
                const isSell = t.category === "Investment Sell";
                const tone = isBuy
                  ? "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30"
                  : isSell
                    ? "text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30"
                    : "text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-950/30";
                const Icon = isBuy
                  ? ArrowDownRight
                  : isSell
                    ? ArrowUpRight
                    : Plus;
                return (
                  <div
                    key={t._id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {t.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(t.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          {" · "}
                          {t.category}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Holdings table ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Holdings</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as HoldingType | "all")
              }
              className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              {holdingTypes.map((t) => (
                <option key={t} value={t}>
                  {holdingTypeLabels[t]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded text-indigo-600 dark:text-indigo-300 focus:ring-indigo-500"
              />
              Show sold
            </label>
          </div>
        </div>

        {holdingsQuery.isLoading ? (
          <TableSkeleton />
        ) : holdingsQuery.isError ? (
          <ErrorState
            inline
            message={(holdingsQuery.error as Error)?.message}
            onRetry={() => holdingsQuery.refetch()}
          />
        ) : filteredHoldings.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Search className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {typeFilter === "all"
                ? "No holdings yet"
                : `No ${holdingTypeLabels[typeFilter]} holdings`}
            </p>
            {typeFilter === "all" &&
              investmentAccounts.length > 0 &&
              cashAccounts.length > 0 && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-800"
                >
                  + Add your first holding
                </button>
              )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <tr>
                    <th className="px-6 py-3">Holding</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Avg Cost</th>
                    <th className="px-4 py-3 text-right">Current</th>
                    <th className="px-4 py-3 text-right">Market Value</th>
                    <th className="px-4 py-3 text-right">P&amp;L</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHoldings.map((h) => (
                    <HoldingRow
                      key={h._id}
                      holding={h}
                      onPrice={() => setPriceTarget(h)}
                      onBuy={() => setBuyTarget(h)}
                      onSell={() => setSellTarget(h)}
                      onEdit={() => setEditTarget(h)}
                      onDelete={() => setDeleteTarget(h)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredHoldings.map((h) => (
                <HoldingCard
                  key={h._id}
                  holding={h}
                  onPrice={() => setPriceTarget(h)}
                  onBuy={() => setBuyTarget(h)}
                  onSell={() => setSellTarget(h)}
                  onEdit={() => setEditTarget(h)}
                  onDelete={() => setDeleteTarget(h)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────── */}
      {showAddModal && (
        <AddHoldingModal
          onClose={() => setShowAddModal(false)}
          investmentAccounts={investmentAccounts}
          cashAccounts={cashAccounts}
        />
      )}
      {buyTarget && (
        <BuyHoldingModal
          holding={buyTarget}
          cashAccounts={cashAccounts}
          onClose={() => setBuyTarget(null)}
        />
      )}
      {sellTarget && (
        <SellHoldingModal
          holding={sellTarget}
          cashAccounts={cashAccounts}
          onClose={() => setSellTarget(null)}
        />
      )}
      {priceTarget && (
        <UpdatePriceModal
          holding={priceTarget}
          onClose={() => setPriceTarget(null)}
        />
      )}
      {editTarget && (
        <EditHoldingModal
          holding={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete Holding"
        description={`Delete "${deleteTarget?.name}"? Linked buy/sell transactions will be preserved.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteHolding.mutateAsync(deleteTarget._id);
            setDeleteTarget(null);
          } catch {
            /* toast in mutation */
          }
        }}
        isLoading={deleteHolding.isPending}
      />
    </div>
    </PullToRefresh>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function SummaryCard({
  tone,
  icon,
  label,
  value,
  meta,
  valueClass,
}: {
  tone: "blue" | "indigo" | "green" | "red" | "purple";
  icon: React.ReactNode;
  label: string;
  value: string;
  meta?: string;
  valueClass?: string;
}) {
  const bg = {
    blue: "bg-blue-100 dark:bg-blue-900/40",
    indigo: "bg-indigo-100 dark:bg-indigo-900/40",
    green: "bg-green-100 dark:bg-green-900/40",
    red: "bg-red-100 dark:bg-red-900/40",
    purple: "bg-purple-100 dark:bg-purple-900/40",
  }[tone];

  return (
    <div className="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
      <div className={`${bg} p-2 rounded-lg w-fit mb-3`}>{icon}</div>
      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
        {label}
      </p>
      <p
        className={`text-lg md:text-2xl font-bold truncate ${
          valueClass ?? "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
      {meta && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{meta}</p>}
    </div>
  );
}

function EmptyBlock({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg h-44 flex flex-col items-center justify-center">
      {icon}
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{message}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  inline,
}: {
  message?: string;
  onRetry: () => void;
  inline?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        inline ? "py-12" : "py-20"
      }`}
    >
      <AlertCircle size={inline ? 32 : 48} className="text-red-400 mb-3" />
      <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Something went wrong</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
        {message || "Please try again"}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
      >
        Try Again
      </button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20" />
          </div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function pnlOf(h: Holding) {
  const market = h.quantity * h.currentPrice;
  const cost = h.quantity * h.avgCostPrice;
  const pnl = market - cost;
  const pct = cost > 0 ? (pnl / cost) * 100 : 0;
  return { market, cost, pnl, pct };
}

function TypeBadge({ type }: { type: HoldingType }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{
        backgroundColor: `${TYPE_COLORS[type]}20`,
        color: TYPE_COLORS[type],
      }}
    >
      {holdingTypeLabels[type]}
    </span>
  );
}

function HoldingRow({
  holding,
  onPrice,
  onBuy,
  onSell,
  onEdit,
  onDelete,
}: {
  holding: Holding;
  onPrice: () => void;
  onBuy: () => void;
  onSell: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { market, pnl, pct } = pnlOf(holding);
  const positive = pnl >= 0;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">{holding.name}</span>
              {!holding.isActive && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  sold
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <TypeBadge type={holding.type} />
              {holding.symbol && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {holding.symbol}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">{holding.quantity}</td>
      <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">
        {formatCurrency(holding.avgCostPrice)}
      </td>
      <td className="px-4 py-4 text-right">
        <button
          onClick={onPrice}
          className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:underline cursor-pointer"
          title="Update price"
        >
          {formatCurrency(holding.currentPrice)}
        </button>
      </td>
      <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
        {formatCurrency(market)}
      </td>
      <td
        className={`px-4 py-4 text-right font-medium ${
          positive ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
        }`}
      >
        {positive ? "+" : "-"}
        {formatCurrency(Math.abs(pnl))}
        <div className="text-xs font-normal">
          {positive ? "+" : ""}
          {pct.toFixed(1)}%
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          <IconBtn
            title="Buy more"
            onClick={onBuy}
            icon={<ArrowDownRight size={14} className="text-blue-600 dark:text-blue-300" />}
          />
          <IconBtn
            title="Sell"
            onClick={onSell}
            disabled={holding.quantity === 0}
            icon={<ArrowUpRight size={14} className="text-amber-600 dark:text-amber-300" />}
          />
          <IconBtn
            title="Edit"
            onClick={onEdit}
            icon={<Edit size={14} className="text-gray-500 dark:text-gray-400" />}
          />
          <IconBtn
            title="Delete"
            onClick={onDelete}
            icon={<Trash2 size={14} className="text-red-500 dark:text-red-400" />}
          />
        </div>
      </td>
    </tr>
  );
}

function HoldingCard({
  holding,
  onPrice,
  onBuy,
  onSell,
  onEdit,
  onDelete,
}: {
  holding: Holding;
  onPrice: () => void;
  onBuy: () => void;
  onSell: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { market, pnl, pct } = pnlOf(holding);
  const positive = pnl >= 0;

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{holding.name}</p>
            {!holding.isActive && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                sold
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <TypeBadge type={holding.type} />
            {holding.symbol && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {holding.symbol}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(market)}
          </p>
          <p
            className={`text-xs font-medium ${
              positive ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
            }`}
          >
            {positive ? "+" : "-"}
            {formatCurrency(Math.abs(pnl))} ({positive ? "+" : ""}
            {pct.toFixed(1)}%)
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
        <div>
          <span className="block text-gray-400 dark:text-gray-500">Qty</span>
          {holding.quantity}
        </div>
        <div>
          <span className="block text-gray-400 dark:text-gray-500">Avg Cost</span>
          {formatCurrency(holding.avgCostPrice)}
        </div>
        <div>
          <button
            onClick={onPrice}
            className="text-left w-full hover:text-indigo-600"
          >
            <span className="block text-gray-400 dark:text-gray-500">Current</span>
            {formatCurrency(holding.currentPrice)}
          </button>
        </div>
      </div>
      <div className="flex gap-1.5">
        <ActionPill onClick={onBuy} tone="blue" label="Buy" />
        <ActionPill
          onClick={onSell}
          tone="amber"
          label="Sell"
          disabled={holding.quantity === 0}
        />
        <ActionPill onClick={onEdit} tone="gray" label="Edit" />
        <ActionPill onClick={onDelete} tone="red" label="Delete" />
      </div>
    </div>
  );
}

function IconBtn({
  icon,
  onClick,
  title,
  disabled,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );
}

function ActionPill({
  label,
  onClick,
  tone,
  disabled,
}: {
  label: string;
  onClick: () => void;
  tone: "blue" | "amber" | "gray" | "red";
  disabled?: boolean;
}) {
  const cls = {
    blue: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100",
    amber: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100",
    gray: "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
    red: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40",
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
    >
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[200] md:p-4">
      <div className="bg-white dark:bg-gray-900 w-full md:max-w-md rounded-t-[2rem] md:rounded-2xl shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[90vh]">
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-4 mb-2 md:hidden" />
        <div className="flex justify-between items-center px-6 pt-2 md:pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain no-scrollbar pb-safe">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-300">{msg}</p>;
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
    hasError ? "border-red-300 bg-red-50 dark:bg-red-950/30" : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
  }`;
}

// ── Add Holding ──────────────────────────────────────────────
function AddHoldingModal({
  onClose,
  investmentAccounts,
  cashAccounts,
}: {
  onClose: () => void;
  investmentAccounts: IAccount[];
  cashAccounts: IAccount[];
}) {
  const create = useCreateHolding();
  const [type, setType] = useState<HoldingType>("stock");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const rawAccountId = (fd.get("accountId") as string | null) ?? "";
    const payload = {
      // accountId is optional: omit when empty so the backend auto-
      // creates a default "Brokerage" investment account on first use.
      ...(rawAccountId ? { accountId: rawAccountId } : {}),
      fromAccountId: fd.get("fromAccountId") as string,
      name: (fd.get("name") as string)?.trim(),
      type,
      symbol: ((fd.get("symbol") as string) || "").trim() || undefined,
      quantity: Number(fd.get("quantity")) || 0,
      pricePerUnit: Number(fd.get("pricePerUnit")) || 0,
      date: (fd.get("date") as string) || undefined,
      maturityDate:
        type === "fd" || type === "ppf"
          ? (fd.get("maturityDate") as string) || undefined
          : undefined,
      interestRate:
        (type === "fd" || type === "ppf") && fd.get("interestRate")
          ? Number(fd.get("interestRate"))
          : undefined,
      notes: ((fd.get("notes") as string) || "").trim() || undefined,
    };
    if (!payload.fromAccountId) return setErrors({ fromAccountId: "Required" });
    if (!payload.name) return setErrors({ name: "Required" });
    if (payload.quantity <= 0)
      return setErrors({ quantity: "Must be greater than 0" });
    if (payload.pricePerUnit <= 0)
      return setErrors({ pricePerUnit: "Must be greater than 0" });

    try {
      await create.mutateAsync(payload);
      onClose();
    } catch {
      /* toast */
    }
  };

  return (
    <ModalShell title="Add Holding" onClose={onClose}>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Asset Type
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {holdingTypes.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors ${
                  type === t
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {holdingTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            name="name"
            placeholder="e.g. Tata Consultancy Services"
            className={inputCls(!!errors.name)}
          />
          <FieldErr msg={errors.name} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Symbol{" "}
              <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">
                (optional)
              </span>
            </label>
            <input
              name="symbol"
              placeholder="TCS"
              className={inputCls(false)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              defaultValue={todayYmd()}
              className={inputCls(false)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="quantity"
              placeholder="10"
              className={inputCls(!!errors.quantity)}
            />
            <FieldErr msg={errors.quantity} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price / Unit (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="pricePerUnit"
              placeholder="3500"
              className={inputCls(!!errors.pricePerUnit)}
            />
            <FieldErr msg={errors.pricePerUnit} />
          </div>
        </div>

        {(type === "fd" || type === "ppf") && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Maturity Date
              </label>
              <input
                type="date"
                name="maturityDate"
                className={inputCls(false)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Interest % (annual)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                name="interestRate"
                placeholder="7.1"
                className={inputCls(false)}
              />
            </div>
          </div>
        )}

        {/* Broker / investment-account picker — only shown when the user
            already has one or more. If they have zero, the backend
            auto-creates a default "Brokerage" account on POST, so we
            don't render this field at all and the form submits without
            an accountId. Power users with multiple brokers (Zerodha,
            Groww, etc.) still pick which one this holding belongs to. */}
        {investmentAccounts.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Investment Account
            </label>
            <select
              name="accountId"
              className={inputCls(!!errors.accountId)}
              defaultValue={investmentAccounts[0]?._id ?? ""}
            >
              {investmentAccounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
            <FieldErr msg={errors.accountId} />
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pay From (cash account)
          </label>
          <select
            name="fromAccountId"
            className={inputCls(!!errors.fromAccountId)}
            defaultValue=""
          >
            <option value="" disabled>
              Select source account
            </option>
            {cashAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} — {formatCurrency(a.balance)}
              </option>
            ))}
          </select>
          <FieldErr msg={errors.fromAccountId} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes{" "}
            <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={2}
            className={inputCls(false)}
            placeholder="Anything you want to remember about this investment"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {create.isPending && <Loader2 size={14} className="animate-spin" />}
            Add Holding
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Buy More ───────────────────────────────────────────────
function BuyHoldingModal({
  holding,
  cashAccounts,
  onClose,
}: {
  holding: Holding;
  cashAccounts: IAccount[];
  onClose: () => void;
}) {
  const buy = useBuyHolding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      fromAccountId: fd.get("fromAccountId") as string,
      quantity: Number(fd.get("quantity")) || 0,
      pricePerUnit: Number(fd.get("pricePerUnit")) || 0,
      date: (fd.get("date") as string) || undefined,
    };
    if (!payload.fromAccountId) return setErrors({ fromAccountId: "Required" });
    if (payload.quantity <= 0) return setErrors({ quantity: "> 0" });
    if (payload.pricePerUnit <= 0) return setErrors({ pricePerUnit: "> 0" });

    try {
      await buy.mutateAsync({ id: holding._id, data: payload });
      onClose();
    } catch {
      /* toast */
    }
  };

  return (
    <ModalShell title={`Buy ${holding.name}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="quantity"
              className={inputCls(!!errors.quantity)}
              autoFocus
            />
            <FieldErr msg={errors.quantity} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price / Unit (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="pricePerUnit"
              defaultValue={holding.currentPrice}
              className={inputCls(!!errors.pricePerUnit)}
            />
            <FieldErr msg={errors.pricePerUnit} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={todayYmd()}
            className={inputCls(false)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pay From
          </label>
          <select
            name="fromAccountId"
            className={inputCls(!!errors.fromAccountId)}
            defaultValue=""
          >
            <option value="" disabled>
              Select source account
            </option>
            {cashAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} — {formatCurrency(a.balance)}
              </option>
            ))}
          </select>
          <FieldErr msg={errors.fromAccountId} />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          Current avg cost: <b>{formatCurrency(holding.avgCostPrice)}</b> ×{" "}
          {holding.quantity} units. Buying more will recompute the weighted
          average.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={buy.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-blue-600 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {buy.isPending && <Loader2 size={14} className="animate-spin" />}
            Confirm Buy
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Sell ───────────────────────────────────────────────
function SellHoldingModal({
  holding,
  cashAccounts,
  onClose,
}: {
  holding: Holding;
  cashAccounts: IAccount[];
  onClose: () => void;
}) {
  const sell = useSellHolding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(holding.quantity);
  const [price, setPrice] = useState(holding.currentPrice);

  const projectedPnl = +((price - holding.avgCostPrice) * qty).toFixed(2);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      toAccountId: fd.get("toAccountId") as string,
      quantity: qty,
      pricePerUnit: price,
      date: (fd.get("date") as string) || undefined,
    };
    if (!payload.toAccountId) return setErrors({ toAccountId: "Required" });
    if (payload.quantity <= 0) return setErrors({ quantity: "> 0" });
    if (payload.quantity > holding.quantity)
      return setErrors({ quantity: `Max ${holding.quantity}` });
    if (payload.pricePerUnit <= 0) return setErrors({ pricePerUnit: "> 0" });

    try {
      await sell.mutateAsync({ id: holding._id, data: payload });
      onClose();
    } catch {
      /* toast */
    }
  };

  return (
    <ModalShell title={`Sell ${holding.name}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
              <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">
                (max {holding.quantity})
              </span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max={holding.quantity}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              className={inputCls(!!errors.quantity)}
              autoFocus
            />
            <FieldErr msg={errors.quantity} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sell Price / Unit (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className={inputCls(!!errors.pricePerUnit)}
            />
            <FieldErr msg={errors.pricePerUnit} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={todayYmd()}
            className={inputCls(false)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Credit To
          </label>
          <select
            name="toAccountId"
            className={inputCls(!!errors.toAccountId)}
            defaultValue=""
          >
            <option value="" disabled>
              Select destination account
            </option>
            {cashAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} — {formatCurrency(a.balance)}
              </option>
            ))}
          </select>
          <FieldErr msg={errors.toAccountId} />
        </div>

        <div
          className={`rounded-lg p-3 text-sm ${
            projectedPnl >= 0
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
          }`}
        >
          Projected realized P&L:{" "}
          <b>
            {projectedPnl >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(projectedPnl))}
          </b>{" "}
          (cost basis {formatCurrency(holding.avgCostPrice)})
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sell.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-amber-600 rounded-xl font-medium hover:bg-amber-700 disabled:opacity-60"
          >
            {sell.isPending && <Loader2 size={14} className="animate-spin" />}
            Confirm Sell
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Update Price (quick) ───────────────────────────────
function UpdatePriceModal({
  holding,
  onClose,
}: {
  holding: Holding;
  onClose: () => void;
}) {
  const updatePrice = useUpdateHoldingPrice();
  const [price, setPrice] = useState(holding.currentPrice);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (price < 0) return;
    try {
      await updatePrice.mutateAsync({
        id: holding._id,
        data: { currentPrice: price },
      });
      onClose();
    } catch {
      /* toast */
    }
  };

  return (
    <ModalShell title={`Update Price — ${holding.name}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Last updated{" "}
          {new Date(holding.priceUpdatedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Price / Unit (₹)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            className={inputCls(false)}
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Market value will become{" "}
            <b>{formatCurrency(holding.quantity * price)}</b>
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updatePrice.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {updatePrice.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            Update
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Edit metadata ──────────────────────────────────────
function EditHoldingModal({
  holding,
  onClose,
}: {
  holding: Holding;
  onClose: () => void;
}) {
  const update = useUpdateHolding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: ((fd.get("name") as string) || "").trim(),
      symbol: ((fd.get("symbol") as string) || "").trim() || null,
      notes: ((fd.get("notes") as string) || "").trim() || null,
      maturityDate: (fd.get("maturityDate") as string) || null,
      interestRate: fd.get("interestRate")
        ? Number(fd.get("interestRate"))
        : null,
    };
    if (!payload.name) return setErrors({ name: "Required" });
    try {
      await update.mutateAsync({ id: holding._id, data: payload });
      onClose();
    } catch {
      /* toast */
    }
  };

  const showFdFields = holding.type === "fd" || holding.type === "ppf";

  return (
    <ModalShell title={`Edit ${holding.name}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            name="name"
            defaultValue={holding.name}
            className={inputCls(!!errors.name)}
          />
          <FieldErr msg={errors.name} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Symbol
          </label>
          <input
            name="symbol"
            defaultValue={holding.symbol ?? ""}
            className={inputCls(false)}
          />
        </div>

        {showFdFields && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Maturity Date
              </label>
              <input
                type="date"
                name="maturityDate"
                defaultValue={
                  holding.maturityDate
                    ? holding.maturityDate.split("T")[0]
                    : ""
                }
                className={inputCls(false)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Interest %
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                name="interestRate"
                defaultValue={holding.interestRate ?? ""}
                className={inputCls(false)}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={holding.notes ?? ""}
            className={inputCls(false)}
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          To change quantity / price, use Buy / Sell / Update Price actions.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={update.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {update.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            Save
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
