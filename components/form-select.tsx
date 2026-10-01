"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export function FormSelect({ id, name, options, placeholder, defaultValue, required, className }: { id: string; name: string; options: { id: string; label: string }[]; placeholder: string; defaultValue?: string; required?: boolean; className?: string }) {
  return <Select name={name} defaultValue={defaultValue || undefined} required={required}>
    <SelectTrigger id={id} className={className || "h-9 w-full bg-card"}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{options.map(option => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent>
  </Select>;
}
