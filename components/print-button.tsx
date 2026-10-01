"use client";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
export function PrintButton() {
  return <Button type="button" onClick={() => { toast.success("Pratinjau cetak dibuka."); window.print(); }} className="print:hidden"><Printer className="size-4" />Export PDF / Cetak</Button>;
}
