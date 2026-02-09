"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends ButtonProps {
  value: string;
  label?: string;
  successMessage?: string;
}

export function CopyButton({
  value,
  label = "Copy",
  successMessage = "Copied to clipboard",
  className,
  variant = "secondary",
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  const copyToClipboard = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      toast.success(successMessage);
    } catch {
      toast.error("Failed to copy");
    }
  }, [value, successMessage]);

  return (
    <Button
      variant={variant}
      className={cn("transition-all min-w-[80px]", className)}
      onClick={copyToClipboard}
      {...props}
    >
      {hasCopied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
      {hasCopied ? "Copied!" : label}
    </Button>
  );
}
