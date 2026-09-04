import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Logo } from '../components/ui/Logo';
/* DEMO-ONLY:START */
import { DEMO_MODE } from '../demo/demoConfig';
import { DemoNotice } from '../demo/DemoUI';
/* DEMO-ONLY:END */

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      
    } catch (error) {
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0A0908] font-sans">
      {}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex">
        {}
        <div className="absolute inset-0 bg-[#0C0B09]">
          <div className="absolute -left-[10%] bottom-[10%] h-[70%] w-[70%] animate-pulse-slow rounded-full bg-[#3A7A72]/15 mix-blend-screen blur-[130px]" />
          <div className="absolute -right-[20%] top-[10%] h-[60%] w-[60%] animate-pulse-slow rounded-full bg-[#2D5D57]/15 mix-blend-screen blur-[120px]" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0C0B09]/50 to-[#0C0B09]" />
        </div>
        
        {}
        <div className="relative z-10 p-12">
        </div>

        {}
        <div className="relative z-10 max-w-2xl p-12">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mb-8 font-display text-[6rem] font-normal leading-[0.95] tracking-tighter text-white"
          >
            Your hiring criteria, once. <br />
            Every resume after, automatic.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mb-12 text-[17px] font-medium leading-relaxed text-[#BFBFBF] max-w-lg"
          >
            Create roles, upload resume batches, and move candidates from raw documents to clear decisions.
          </motion.p>

          {}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-[#4A8B82]" />
              <span className="text-sm font-bold text-white">Criteria-First Roles</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-[#4A8B82]" />
              <span className="text-sm font-bold text-white">Bulk Batch Screening</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-[#4A8B82]" />
              <span className="text-sm font-bold text-white">Human Review Layer</span>
            </div>
          </motion.div>
        </div>

        {}
        <div className="relative z-10 p-12" />
      </div>

      {}
      <div className="relative z-10 flex w-full items-center justify-center p-8 lg:w-1/2 lg:bg-[#0C0B09] lg:border-l lg:border-[#1E1B18]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 25 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#2A2420] bg-[#131110] shadow-xl">
              <Logo className="h-7 w-7 text-[#EDEAE5]" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-tight text-white leading-none">Inference</h2>
              <p className="mt-1 label-caps">CREATE ACCOUNT</p>
            </div>
          </div>

          {/* DEMO-ONLY:START */}
          {DEMO_MODE && (
            <DemoNotice className="mb-8">
              Sign-up is closed on the public demo — accounts live in MongoDB Atlas. Head back to
              sign in and use the shared demo credentials shown there.
            </DemoNotice>
          )}
          {/* DEMO-ONLY:END */}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-5">
              {}
              <div className="relative group">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="peer h-16 w-full rounded-2xl border border-[#2A2420] bg-[#171512] px-5 pb-2 pt-6 text-[15px] font-mono text-[#EDEAE5] placeholder-transparent outline-none transition-all focus:border-[#3A7A72] focus:bg-[#1F1C19] focus:ring-1 focus:ring-[#3A7A72]"
                  placeholder="Jane Smith"
                  spellCheck={false}
                />
                <label 
                  htmlFor="name"
                  className="pointer-events-none absolute left-5 top-4 label-caps transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#3A7A72] peer-valid:top-2 peer-valid:text-[10px] peer-autofill:top-2 peer-autofill:text-[10px] peer-autofill:text-[#3A7A72]"
                >
                  FULL NAME
                </label>
              </div>

              {}
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer h-16 w-full rounded-2xl border border-[#2A2420] bg-[#171512] px-5 pb-2 pt-6 text-[15px] font-mono text-[#EDEAE5] placeholder-transparent outline-none transition-all focus:border-[#3A7A72] focus:bg-[#1F1C19] focus:ring-1 focus:ring-[#3A7A72]"
                  placeholder="you@company.com"
                  spellCheck={false}
                />
                <label 
                  htmlFor="email"
                  className="pointer-events-none absolute left-5 top-4 label-caps transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#3A7A72] peer-valid:top-2 peer-valid:text-[10px] peer-autofill:top-2 peer-autofill:text-[10px] peer-autofill:text-[#3A7A72]"
                >
                  WORK EMAIL
                </label>
              </div>

              {}
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer h-16 w-full rounded-2xl border border-[#2A2420] bg-[#171512] pl-5 pr-14 pb-2 pt-6 text-[15px] font-mono text-[#EDEAE5] placeholder-transparent outline-none transition-all focus:border-[#3A7A72] focus:bg-[#1F1C19] focus:ring-1 focus:ring-[#3A7A72]"
                  placeholder="At least 8 chars"
                />
                <label 
                  htmlFor="password"
                  className="pointer-events-none absolute left-5 top-4 label-caps transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#3A7A72] peer-valid:top-2 peer-valid:text-[10px] peer-autofill:top-2 peer-autofill:text-[10px] peer-autofill:text-[#3A7A72]"
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-white transition-colors p-2 z-20"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>

              {}
              <div className="relative group">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="peer h-16 w-full rounded-2xl border border-[#2A2420] bg-[#171512] pl-5 pr-14 pb-2 pt-6 text-[15px] font-mono text-[#EDEAE5] placeholder-transparent outline-none transition-all focus:border-[#3A7A72] focus:bg-[#1F1C19] focus:ring-1 focus:ring-[#3A7A72]"
                  placeholder="Repeat password"
                />
                <label 
                  htmlFor="confirmPassword"
                  className="pointer-events-none absolute left-5 top-4 label-caps transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#3A7A72] peer-valid:top-2 peer-valid:text-[10px] peer-autofill:top-2 peer-autofill:text-[10px] peer-autofill:text-[#3A7A72]"
                >
                  CONFIRM PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-white transition-colors p-2 z-20"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="group mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#3A7A72] text-sm font-bold uppercase tracking-widest text-[#0C0B09] transition-all hover:bg-[#3A7A72]/90 disabled:opacity-80 disabled:cursor-not-allowed relative z-20"
            >
              CREATE ACCOUNT
              {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <hr className="flex-1 border-[#2A2420]" />
            <span className="label-caps">OR</span>
            <hr className="flex-1 border-[#2A2420]" />
          </div>

          <p className="text-center text-[15px] font-medium text-[#928D88]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#3A7A72] underline-offset-4 transition-colors hover:text-[#5BA096] hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
