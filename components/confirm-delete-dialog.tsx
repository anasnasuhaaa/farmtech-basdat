"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <AlertDialogAction asChild><Button type="submit" variant="destructive" disabled={pending}>{pending ? "Memproses..." : label}</Button></AlertDialogAction>;
}
export function ConfirmDeleteDialog({ action, id, operation = "delete", label = "Hapus", title = "Hapus data ini?" }: { action: (form: FormData) => void | Promise<void>; id?: string; operation?: string; label?: string; title?: string }) {
  const [open, setOpen] = useState(false);
  return <AlertDialog open={open} onOpenChange={setOpen}>
    <AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="size-4" />{label}</Button></AlertDialogTrigger>
    <AlertDialogContent className="max-w-[calc(100vw-2rem)]"><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>Data yang sudah memiliki keterkaitan transaksi mungkin tidak dapat dihapus. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><form action={action}><input type="hidden" name="_operation" value={operation} /><input type="hidden" name="_id" value={id} /><ConfirmButton label={label} /></form></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
