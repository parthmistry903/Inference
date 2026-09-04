import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  Briefcase, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { Logo } from './Logo';
import { ChangePasswordModal } from './ChangePasswordModal';
import { HelpSupportModal } from './HelpSupportModal';

function initials(name?: string): string {
  if (!name) return 'IN';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const { user, logout } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Briefcase, label: 'Jobs', to: '/jobs' },
  ];

  const systemItems = [
    { icon: HelpCircle, label: 'Help & Support', to: '#' },
  ];

  const panel = (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col glass-panel border-r border-white/5 bg-app/40">
      {}
      <div className="px-6 pt-8 pb-6">
        <NavLink to="/dashboard" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_4px_24px_rgba(176,122,62,0.15)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_4px_32px_rgba(176,122,62,0.25)]">
            <Logo className="h-6 w-6 text-[#B07A3E]" />
          </div>
          <div>
            <span className="block font-display text-lg font-normal text-primary tracking-tight leading-none">Inference</span>
          </div>
        </NavLink>
      </div>

      {}
      <div className="flex-1 px-4 py-2 space-y-8 overflow-y-auto scrollbar-thin">
        <div>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                        : 'text-secondary hover:bg-white/5 hover:text-primary',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('h-4 w-4 transition-colors duration-200', isActive ? 'text-[#B07A3E]' : 'text-muted group-hover:text-[#B07A3E]')} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">System</p>
          <nav className="space-y-1">
            {systemItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.to}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.label === 'Help & Support') {
                      setShowHelpSupport(true);
                    }
                  }}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-secondary hover:bg-white/5 hover:text-primary transition-all duration-200"
                >
                  <Icon className="h-4 w-4 text-muted group-hover:text-primary transition-colors duration-200" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {}
      <div className="p-4 relative" ref={profileMenuRef}>
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bottom-full left-4 right-4 mb-2 glass-card rounded-xl overflow-hidden border border-white/10 py-1"
            >
              <button
                onClick={() => { setShowProfileMenu(false); setShowChangePassword(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors"
              >
                <KeyRound className="h-4 w-4 text-muted" />
                Change Password
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#E85C5C] hover:bg-[#E85C5C]/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors duration-200 border border-transparent hover:border-white/5"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#2A2420] font-bold text-[#EDEAE5] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            {initials(user?.name)}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-semibold text-primary break-words leading-tight">{user?.name ?? 'User'}</p>
            <p className="text-[11px] font-medium text-muted break-all mt-0.5 leading-tight">{user?.email ?? ''}</p>
          </div>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile topbar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between glass-panel border-b border-white/5 px-4 md:hidden">
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <Logo className="h-5 w-5 text-[#B07A3E]" />
          <span className="font-display text-base font-normal text-primary">Inference</span>
        </NavLink>
        <div className="h-9 w-9" />
      </header>

      {/* Desktop sidebar */}
      <div className="hidden md:block">{panel}</div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <div className="md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" 
              onClick={() => setOpen(false)} 
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-40 w-[260px]"
            >
              {panel}
            </motion.div>
            <Button
              variant="ghost"
              size="sm"
              className="fixed left-[270px] top-4 z-50 h-10 w-10 p-0 rounded-full glass-panel"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </AnimatePresence>

      {}
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      {}
      <HelpSupportModal
        open={showHelpSupport}
        onClose={() => setShowHelpSupport(false)}
      />
    </>
  );
}
