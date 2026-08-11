import Papa from "papaparse";
import { formatDate } from "./utils";

export interface CSVTransactionRecord {
  date: string;
  type: string;
  categoryName: string;
  item: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
}

export function downloadTransactionsCSV(
  transactions: CSVTransactionRecord[],
  filenamePrefix: string = "financial_transactions"
) {
  if (!transactions || transactions.length === 0) {
    alert("No transactions available to export.");
    return;
  }

  const csvRows = transactions.map((t) => ({
    Date: formatDate(t.date),
    Type: t.type,
    Category: t.categoryName,
    Item: t.item,
    Amount: t.amount.toFixed(2),
    "Payment Method": t.paymentMethod,
    Notes: t.notes || "",
    Tags: t.tags ? t.tags.join(", ") : "",
    "Created At": t.createdAt ? formatDate(t.createdAt) : "",
  }));

  const csvString = Papa.unparse(csvRows, {
    quotes: true,
    header: true,
  });

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
