import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Mail, ExternalLink, Linkedin, Github, Globe, HelpCircle, ArrowRight, Code2, Twitter } from 'lucide-react';

interface HelpSupportModalProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'guide' | 'support';

export function HelpSupportModal({ open, onClose }: HelpSupportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('guide');

  const steps = [
    {
      num: '01',
      title: 'Define the Position',
      description: 'Create a new job pipeline by inputting the job description, required technical skills, and specific hiring criteria.',
    },
    {
      num: '02',
      title: 'Upload Candidate Resumes',
      description: 'Drag and drop PDF resumes into the job interface. Inference supports batch uploading dozens of files at once.',
    },
    {
      num: '03',
      title: 'Asynchronous Queueing',
      description: 'Uploaded resumes are registered and securely pushed to an AWS SQS queue to ensure high availability and robust processing.',
    },
    {
      num: '04',
      title: 'LLM Screening Pass',
      description: 'Background workers pull from the queue, extract the PDF text, and prompt an LLM served through AWS Bedrock to score and summarise candidate fit.',
    },
    {
      num: '05',
      title: 'Analyze & Rank',
      description: 'Review screened candidates in a flat, high-density table. Sort by AI match score, filter by skills, and inspect detailed profiles.',
    },
    {
      num: '06',
      title: 'Take Action & Export',
      description: 'Add private evaluation notes, update candidate application states, and export your finalized shortlist directly to a CSV file.',
    },
  ];

  const contactLinks = [
    {
      label: 'Personal Portfolio',
      url: 'https://code.parthmistry.me',
      icon: Globe,
      desc: 'Explore other products, technical articles, and design works.',
    },
    {
      label: 'Project Repository',
      url: 'https://github.com/parthmistry903/Inference',
      icon: Github,
      desc: 'Review the clean architecture, background workers, and codebase.',
    },
    {
      label: 'GitHub Profile',
      url: 'https://github.com/parthmistry903',
      icon: Github,
      desc: 'Check out my open-source contributions and other projects.',
    },
    {
      label: 'LeetCode',
      url: 'https://leetcode.com/u/ParthDSA/',
      icon: Code2,
      desc: 'View my algorithmic problem-solving track record.',
    },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/parth-mistry-771064329?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
      icon: Linkedin,
      desc: 'Let\'s connect professionally and discuss industry opportunities.',
    },
    {
      label: 'X (Twitter)',
      url: 'https://x.com/xprimeparth?s=21',
      icon: Twitter,
      desc: 'Follow me for thoughts on software engineering and tech.',
    },
    {
      label: 'Send Email',
      url: 'mailto:parthmistry903@gmail.com',
      icon: Mail,
      desc: 'Drop a direct message for inquiries or architectural discussions.',
    },
  ];

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
            onClick={onClose}
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
              className="pointer-events-auto w-full max-w-2xl glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {}
              <div className="px-8 pt-8 pb-5 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3A7A72]/15 border border-[#3A7A72]/20">
                      <HelpCircle className="h-5 w-5 text-[#3A7A72]" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl text-primary tracking-tight">Help & Support</h2>
                      <p className="text-[13px] text-muted mt-0.5">Learn how the system works or reach out to the builder</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted hover:bg-white/10 hover:text-primary transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {}
                <div className="flex gap-2 mt-6 p-0.5 bg-white/5 rounded-xl border border-white/5">
                  <button
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      activeTab === 'guide'
                        ? 'bg-[#3A7A72] text-white shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-white/5'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    How it Works
                  </button>
                  <button
                    onClick={() => setActiveTab('support')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      activeTab === 'support'
                        ? 'bg-[#3A7A72] text-white shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-white/5'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Technical Contact
                  </button>
                </div>
              </div>

              {}
              <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin space-y-6">
                {activeTab === 'guide' ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-[13.5px] text-secondary leading-relaxed">
                      Inference parses resumes asynchronously behind a queue and scores them with a constrained LLM prompt, then applies a deterministic rubric on top of the model output. Follow the workflow below.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {steps.map((step) => (
                        <div key={step.num} className="p-4 rounded-2xl border border-[#2A2420] bg-[#171512] transition-colors hover:border-[#3D3630]">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="font-mono text-xs font-bold text-[#3A7A72] bg-[#3A7A72]/10 px-2 py-0.5 rounded border border-[#3A7A72]/20">{step.num}</span>
                            <h3 className="text-[15px] font-semibold text-primary">{step.title}</h3>
                          </div>
                          <p className="text-[13px] text-muted leading-relaxed pl-1">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {}
                    <div className="rounded-2xl border border-[#2A2420] bg-[#171512] p-5 space-y-3.5">
                      <h3 className="text-[15px] font-semibold text-primary">System Tech Stack</h3>
                      <p className="text-[13.5px] text-secondary leading-relaxed">
                        Inference is designed as a showcase project demonstrating a complete production-grade resume analysis system:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Node.js', 'Express', 'MongoDB', 'AWS S3', 'AWS SQS', 'AWS Bedrock'].map((tag) => (
                          <span key={tag} className="text-[11px] font-medium font-mono px-2 py-0.5 rounded border border-white/5 bg-white/5 text-secondary">{tag}</span>
                        ))}
                      </div>

                    </div>

                    {}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {contactLinks.map((link) => {
                        const LinkIcon = link.icon;
                        return (
                          <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-3.5 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#3A7A72]/30 hover:shadow-[0_4px_24px_rgba(58,122,114,0.12)] transition-all duration-300"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-muted group-hover:text-[#3A7A72] group-hover:bg-[#3A7A72]/10 group-hover:border-[#3A7A72]/30 group-hover:shadow-[0_0_12px_rgba(58,122,114,0.2)] transition-all duration-300 flex-shrink-0">
                              <LinkIcon className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[13.5px] font-semibold text-primary group-hover:text-[#3A7A72] transition-colors">{link.label}</span>
                                <ExternalLink className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="text-xs text-muted leading-normal">{link.desc}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {}
              <div className="px-8 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] font-mono text-muted">v1.0.0 · Production Portfolio Release</span>
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#3A7A72] transition-colors"
                >
                  Dismiss Guide
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
