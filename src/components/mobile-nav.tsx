"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  credits: number;
  onLogout: () => void;
  children?: React.ReactNode;
}

export function MobileNav({
  isOpen,
  onClose,
  email,
  credits,
  onLogout,
  children,
}: MobileNavProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs border-l border-white/10 bg-[#050505] p-6 shadow-2xl sm:max-w-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-black uppercase italic tracking-tighter text-white">
                Crumb Toast
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="space-y-2">
                <div className="text-xs text-white/40 font-mono uppercase tracking-widest">
                  Operator
                </div>
                <div className="text-sm text-white font-mono break-all">
                  {email}
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Status Badges */}
              <div className="space-y-3">
                <div className="text-xs text-white/40 font-mono uppercase tracking-widest">
                  Status
                </div>
                <div className="flex flex-col gap-3">
                  <Badge
                    variant="outline"
                    className="w-fit border-[#39ff14]/50 bg-[#39ff14]/5 text-[#39ff14] animate-pulse rounded-sm px-3 py-1 text-xs uppercase tracking-widest"
                  >
                    SYSTEM: HUNTING
                  </Badge>
                  <Badge
                    className={`w-fit border border-white/10 bg-black/50 text-white rounded-sm px-3 py-1 font-mono ${
                      credits === 0 ? "text-red-500 border-red-500/50" : ""
                    }`}
                  >
                    AMMO: {credits}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Actions */}
              <div className="space-y-3">
                 <div className="text-xs text-white/40 font-mono uppercase tracking-widest">
                  Actions
                </div>

                {/* Upgrade Dialog (Passed as children) */}
                <div className="[&_button]:w-full [&_button]:justify-start [&_button]:h-12">
                   {children}
                </div>

                <Link href="/billing" onClick={onClose}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-[#00f3ff] rounded-sm uppercase tracking-wider text-xs font-bold h-12"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Arsenal
                  </Button>
                </Link>

                <Button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12 uppercase tracking-wider text-xs font-bold"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Cyberpunk Decor */}
             <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/30 to-transparent" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
