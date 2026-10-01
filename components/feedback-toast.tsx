"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export function FeedbackToast({ success, error }: { success?: string; error?: string }) {
  useEffect(() => {
    if (success) toast.success(success);
    if (error) toast.error(error);
    if (success || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("error");
      window.history.replaceState(window.history.state, "", url.toString());
    }
  }, [success, error]);
  return null;
}
