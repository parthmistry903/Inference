import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { BentoCard } from '../ui/BentoCard';
import { cn } from '../../utils/cn';
import { useUpload } from '../../hooks/useUpload';

interface BatchUploaderProps {
  jobId: string;
  upload: ReturnType<typeof useUpload>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_COLORS: Record<string, { color: string, bg: string }> = {
  pending:    { color: 'text-muted', bg: 'bg-white/5' },
  uploading:  { color: 'text-blue-400', bg: 'bg-blue-400/10' },
  done:       { color: 'text-verdigris', bg: 'bg-verdigris/10' },
  error:      { color: 'text-[#E85C5C]', bg: 'bg-[#E85C5C]/10' },
};

export function BatchUploader({ jobId, upload }: BatchUploaderProps) {
  const { files, fileStatuses, phase, uploadedCount, addFiles, removeFile, startUpload } = upload;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    onDrop: addFiles,
  });

  const isUploading = phase === 'uploading' || phase === 'confirming';

  return (
    <BentoCard glow className="mx-auto max-w-3xl p-8 md:p-10">
      {}
      <div
        {...getRootProps()}
        className={cn(
          'flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed transition-all duration-300 p-6 text-center relative overflow-hidden',
          isDragActive 
            ? 'border-[#B07A3E] bg-[#B07A3E]/5 scale-[1.02]' 
            : 'border-[#2A2420] bg-white/5 hover:border-[#B07A3E]/50 hover:bg-white/10',
        )}
      >
        <input {...getInputProps()} />
        <motion.div 
          animate={{ y: isDragActive ? -5 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-[18px] border shadow-xl transition-colors duration-300 mb-6',
            isDragActive 
              ? 'border-[#B07A3E]/30 bg-[#B07A3E]/20 text-[#B07A3E]' 
              : 'border-[#2A2420] bg-[#1B1916] shadow-black/40 text-muted',
          )}
        >
          <CloudUpload className="h-8 w-8" />
        </motion.div>

        {files.length === 0 ? (
          <>
            <p className="font-display text-[26px] font-normal text-primary tracking-tight">Drop your PDFs. We score, rank, and summarize — you decide.</p>
            <p className="mt-2 text-[#928D88] font-medium text-sm">or click to browse your files</p>
          </>
        ) : (
          <>
            <p className="font-display text-[26px] font-normal text-primary tracking-tight">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            <p className="mt-2 text-[#928D88] font-medium text-sm">Drop more PDFs to add to batch</p>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center text-center">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
          Max 500 files &middot; 10 MB limit
        </p>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="scrollbar-thin mt-8 max-h-64 space-y-3 overflow-y-auto pr-2"
          >
            {files.map((file) => {
              const status = fileStatuses.get(`${file.name}:${file.size}`) ?? 'pending';
              const theme = STATUS_COLORS[status] || STATUS_COLORS.pending;
              
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  key={`${file.name}:${file.size}`}
                  className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-primary">{file.name}</p>
                    <p className="text-xs font-medium text-muted">{formatSize(file.size)}</p>
                  </div>
                  <span
                    className={cn('flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider', theme.bg, theme.color)}
                  >
                    {status}
                  </span>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/5 text-muted hover:bg-[#E85C5C]/10 hover:border-[#E85C5C]/20 hover:text-[#E85C5C] transition-colors disabled:opacity-50"
                    onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                    disabled={isUploading}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
        <p className="font-semibold text-secondary">
          <span className="text-primary font-bold">{files.length}</span> file{files.length !== 1 ? 's' : ''} ready
        </p>
        <Button
          size="lg"
          disabled={files.length === 0 || isUploading}
          isLoading={isUploading}
          onClick={() => void startUpload(jobId)}
          className="w-full sm:w-auto"
        >
          {isUploading ? `Uploading ${uploadedCount} / ${files.length}…` : 'Upload & Screen Candidates'}
        </Button>
      </div>
    </BentoCard>
  );
}
