"use client";

import * as React from "react";
import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";

export interface TypewriterTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  speed?: number;
}

export function TypewriterText({ text, speed = 10, className, ...props }: TypewriterTextProps) {
  const { displayedText, isTyping } = useTypewriter(text, speed);

  return (
    <div className={cn("inline", className)} {...props}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-2 h-4 bg-[#00f3ff] animate-blink ml-1 align-middle" />
      )}
    </div>
  );
}
