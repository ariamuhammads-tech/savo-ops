"use client";

import { useFormStatus } from "react-dom";
import { Loader2, type LucideIcon } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

/** Submit button that shows a spinner while the form action is pending. */
export function SubmitButton({
  children,
  pendingText,
  icon: Icon,
  ...props
}: ButtonProps & { pendingText?: string; icon?: LucideIcon }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : Icon ? (
        <Icon />
      ) : null}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

/**
 * Submit button that asks for confirmation before submitting.
 * Place inside a <form action={serverAction}>.
 */
export function ConfirmSubmitButton({
  children,
  confirmText = "Yakin ingin menghapus? Tindakan ini tidak bisa dibatalkan.",
  ...props
}: ButtonProps & { confirmText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      {...props}
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
