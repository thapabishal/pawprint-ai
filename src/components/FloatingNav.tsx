import React from 'react';
import { NavLink,  } from 'react-router-dom';
import { Camera, Search, Map as MapIcon, LayoutDashboard, Dog } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCatchStore } from '@/stores/catchStore';
import { cn } from '@/lib/utils';

export const FloatingNav: React.FC = () => {
  const { draft } = useCatchStore();
  const isVaccinationMode = draft.programme_type === 'vaccination';

  const navItems = [
    { to: '/catch', icon: Camera, label: 'Catch' },
    { to: '/identify', icon: Search, label: 'Identify' },
    { to: '/dogs', icon: Dog, label: 'Dogs' },
    { to: '/map', icon: MapIcon, label: 'Map' },
    { to: '/', icon: LayoutDashboard, label: 'Stats' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="max-w-md mx-auto h-[64px] glass-nav rounded-[24px] shadow-floating flex items-center justify-around px-2 pointer-events-auto border border-white/40"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
                  isActive
                    ? (isVaccinationMode && item.to === '/catch' ? "text-accent" : "text-primary")
                    : "text-muted hover:text-body"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative p-2">
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="relative z-10"
                    />
                    {isActive && (
                      <motion.div
                        layoutId="nav-glow"
                        className={cn(
                          "absolute inset-0 rounded-full blur-md opacity-40",
                          isVaccinationMode && item.to === '/catch' ? "bg-accent shadow-amber-glow" : "bg-primary shadow-teal-glow"
                        )}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider mb-1 transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0 h-0"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className={cn(
                        "absolute bottom-2 h-1 w-1 rounded-full",
                        isVaccinationMode && item.to === '/catch' ? "bg-accent" : "bg-primary"
                      )}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </motion.nav>
    </div>
  );
};
