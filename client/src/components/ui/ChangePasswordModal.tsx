import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from './Button';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from './Toast';
import { useAuth } from '../../hooks/useAuth';
/* DEMO-ONLY:START */
import { DEMO_MODE } from '../../demo/demoConfig';
import { DemoNotice } from '../../demo/DemoUI';
/* DEMO-ONLY:END */

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetFields = () => {
    setName('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>('/auth/change-password', {
        name,
        currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      toast('Password changed successfully', 'success');
      handleClose();
    },
    onError: (error) => {
      toast(getApiErrorMessage(error), 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }
    mutation.mutate();
  };

  const newPasswordStrength = (() => {
    if (newPassword.length === 0) return null;
    if (newPassword.length < 8) return { label: 'Too short', color: 'bg-[#E85C5C]', width: '25%' };
    if (/(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(newPassword)) return { label: 'Strong', color: 'bg-[#3A7A72]', width: '100%' };
    if (/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) return { label: 'Good', color: 'bg-[#B07A3E]', width: '65%' };
    return { label: 'Weak', color: 'bg-[#E85C5C]', width: '35%' };
  })();

  return (
    <AnimatePresence>
      {open && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md glass-card rounded-3xl border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {}
              <div className="px-8 pt-8 pb-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B07A3E]/15 border border-[#B07A3E]/20">
                      <KeyRound className="h-5 w-5 text-[#B07A3E]" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl text-primary tracking-tight">Change Password</h2>
                      <p className="text-xs text-muted mt-0.5">Verify your identity to continue</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted hover:bg-white/10 hover:text-primary transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {}
              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
                {/* DEMO-ONLY:START */}
                {DEMO_MODE && (
                  <DemoNotice>
                    The demo account is shared and its password is fixed, so this form is read-only
                    here. It works normally once the API and MongoDB are connected.
                  </DemoNotice>
                )}
                {/* DEMO-ONLY:END */}
                {}
                <div className="flex items-start gap-3 rounded-2xl bg-[#B07A3E]/8 border border-[#B07A3E]/15 p-4">
                  <ShieldCheck className="h-4 w-4 text-[#B07A3E] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-secondary leading-relaxed">
                    Enter your full name exactly as registered{user?.name ? ` (${user.name})` : ''} along with your current password to verify your identity.
                  </p>
                </div>

                {/* Full name */}
                <div className="relative group">
                  <input
                    id="change-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="peer h-14 w-full rounded-2xl border border-[#2A2420] bg-[#171512] px-5 pb-2 pt-5 text-[15px] text-[#EDEAE5] placeholder-transparent outline-none transition-all focus:border-[#3D3630] focus:bg-[#1F1C19] focus:ring-1 focus:ring-[#3D3630]"
                    placeholder="Full Name"
                    autoComplete="name"
                  />
                  <label
                    htmlFor="change-name"
                    className="pointer-events-none absolute left-5 top-2 label-caps transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[14px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-valid:top-2 peer-valid:text-[10px]"
                  >
                    Full Name
                  </label>
                </div>

                {/* Current password */}
                <div className="relative group">
                  <input
                    id="change-current"
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="peer h-14 w-full rounded-2xl border border-[#2A2420] bg-[#171512] px-5 pb-2 pt-5 pr-14 text-[15px] font-mono text-[#EDEAE5] placeholder-transparent outline-none transition-all focus:border-[#3D3630] focus:bg-[#1F1C19] focus:ring-1 focus:ring-[#3D3630]"
                    placeholder="Current Password"
                  />
                  <label
                    htmlFor="change-current"
                    className="pointer-events-none absolute left-5 top-2 label-caps transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[14px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-valid:top-2 peer-valid:text-[10px]"
                  >
                    Current Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {}
                <div className="relative group">
                  <input
                    id="change-new"
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="peer h-14 w-full rounded-2xl border border-[#2A2420] bg-[#171512] px-5 pb-2 pt-5 pr-14 text-[15px] font-mono text-[#EDEAE5] placeholder-transparent outline-none transition-all focus:border-[#3D3630] focus:bg-[#1F1C19] focus:ring-1 focus:ring-[#3D3630]"
                    placeholder="New Password"
                  />
                  <label
                    htmlFor="change-new"
                    className="pointer-events-none absolute left-5 top-2 label-caps transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[14px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-valid:top-2 peer-valid:text-[10px]"
                  >
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {}
                {newPasswordStrength && (
                  <div className="px-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Strength</span>
                      <span className="text-[11px] font-bold" style={{ color: newPasswordStrength.color.replace('bg-', '') }}>{newPasswordStrength.label}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/10">
                      <motion.div
                        className={`h-1 rounded-full ${newPasswordStrength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: newPasswordStrength.width }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Confirm password */}
                <div className="relative group">
                  <input
                    id="change-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="peer h-14 w-full rounded-2xl border border-[#2A2420] bg-[#171512] px-5 pb-2 pt-5 pr-14 text-[15px] font-mono text-[#EDEAE5] placeholder-transparent outline-none transition-all focus:border-[#3D3630] focus:bg-[#1F1C19] focus:ring-1 focus:ring-[#3D3630]"
                    placeholder="Confirm New Password"
                  />
                  <label
                    htmlFor="change-confirm"
                    className="pointer-events-none absolute left-5 top-2 label-caps transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[14px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-valid:top-2 peer-valid:text-[10px]"
                  >
                    Confirm New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {}
                <AnimatePresence>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs font-semibold text-[#E85C5C] px-1"
                    >
                      Passwords do not match
                    </motion.p>
                  )}
                </AnimatePresence>

                {}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={mutation.isPending}
                  >
                    Cancel
                  </Button>
                  <button
                    type="submit"
                    disabled={mutation.isPending || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                    className="flex-1 h-10 rounded-full bg-[#B07A3E] text-sm font-bold uppercase tracking-widest text-[#0C0B09] transition-all hover:bg-[#B07A3E]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending ? 'Saving…' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
