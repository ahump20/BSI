'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
}

interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
}

export function MobileMenuDrawer({
  open,
  onClose,
  items,
}: MobileMenuDrawerProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 bg-midnight/95 backdrop-blur-xl border-b border-white/10"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Close Button */}
            <div className="flex justify-end p-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="px-4 pb-4 space-y-1">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={`block w-full px-4 py-3 rounded-lg transition-all min-h-12 flex items-center ${
                      active
                        ? 'text-[#BF5700] font-semibold bg-white/10'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
