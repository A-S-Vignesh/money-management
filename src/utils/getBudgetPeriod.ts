export type Period = "Weekly" | "Monthly" | "Quarterly" | "Yearly";

export function getPeriodRange(period: Period): { startDate: string; endDate: string } {
  const now = new Date();

  let start: Date, end: Date;

  switch (period) {
    case "Weekly": {
      const day = now.getUTCDay(); // 0 = Sunday
      const diffToMonday = day === 0 ? -6 : 1 - day;

      start = new Date(now);
      start.setUTCDate(now.getUTCDate() + diffToMonday);
      start.setUTCHours(0, 0, 0, 0);

      end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      break;
    }

    case "Monthly": {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      end.setUTCHours(23, 59, 59, 999);
      break;
    }

    case "Quarterly": {
      const quarter = Math.floor(now.getUTCMonth() / 3);
      start = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3, 1));
      end = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3 + 3, 0));
      end.setUTCHours(23, 59, 59, 999);
      break;
    }

    case "Yearly": {
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
      end.setUTCHours(23, 59, 59, 999);
      break;
    }

    default:
      throw new Error("Invalid period");
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}
