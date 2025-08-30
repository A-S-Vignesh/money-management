"use client";

type RowData = Record<string, string | number | boolean | null | undefined>;

export default function ExportCSVButton({
  data = [],
  filename = "data.csv",
  label = "Export CSV",
}: {
  data?: any[];
  filename?: string;
  label?: string;
}) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).filter((key) => key !== "_id");

    const csvRows = [
      headers.join(","), // Header row
      ...data.map((row) =>
        headers
          .map((field) => {
            const value = row[field];
            return typeof value === "string"
              ? `"${value.replace(/"/g, '""')}"`
              : value ?? ""; // fallback for null/undefined
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
    >
      {label}
    </button>
  );
}
