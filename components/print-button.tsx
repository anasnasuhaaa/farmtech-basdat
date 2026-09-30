"use client";
export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground print:hidden">Export PDF / Cetak</button>;
}
