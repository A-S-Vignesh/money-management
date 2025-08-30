interface Transaction {
  createdAt: string; // ISO date string
  categoryId: string;
  amount: number;
}

export function calculateSpend(
  transactions: Transaction[] | undefined,
  categoryId: string,
  startDate: string | Date,
  endDate: string | Date
): number {
  if (!transactions || !Array.isArray(transactions)) return 0;

  return transactions
    .filter((txn) => {
      const txnDate = new Date(txn.createdAt);
      return (
        txn.categoryId === categoryId &&
        txnDate >= new Date(startDate) &&
        txnDate <= new Date(endDate)
      );
    })
    .reduce((total, txn) => total + txn.amount, 0);
}
