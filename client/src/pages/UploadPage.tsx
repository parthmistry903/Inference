import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { BatchProgress } from '../components/batch/BatchProgress';
import { BatchUploader } from '../components/batch/BatchUploader';
import { useUpload } from '../hooks/useUpload';
import { api } from '../services/api';
import type { Job } from '../types';
/* DEMO-ONLY:START */
import { DEMO_MODE } from '../demo/demoConfig';
import { DemoNotice } from '../demo/DemoUI';
/* DEMO-ONLY:END */

export default function UploadPage() {
  const { jobId = '' } = useParams();
  const navigate = useNavigate();
  const upload = useUpload();
  const { data: job } = useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => api.get<Job>(`/jobs/${jobId}`),
    enabled: Boolean(jobId),
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto pb-12 pt-4"
    >
      <div className="mb-10 text-center flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-4 self-start"
          onClick={() => navigate(`/jobs/${jobId}`)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Job
        </Button>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_8px_32px_rgba(74,139,130,0.15)] mb-6">
          <Upload className="h-8 w-8 text-verdigris" />
        </div>
        <h1 className="font-display text-[38px] font-normal leading-tight text-primary tracking-tight">
          Upload Resumes
        </h1>
        {job && (
          <p className="mt-3 flex items-center justify-center gap-2 font-medium text-lg text-secondary">
            Screening candidates for <span className="text-[#EDEAE5] font-semibold">{job.title}</span>
          </p>
        )}
      </div>

      {/* DEMO-ONLY:START */}
      {DEMO_MODE && (
        <DemoNotice className="mb-6">
          Drop files in and press upload to see the flow. The request stops at the presign step:
          real uploads need an S3 bucket for the PDFs, an SQS queue to fan the work out to background
          workers, and an LLM key for the scoring pass. Open any completed batch instead to see what
          those workers produce.
        </DemoNotice>
      )}
      {/* DEMO-ONLY:END */}

      <div className="relative z-10">
        {upload.phase === 'processing' && upload.batchId ? (
          <BatchProgress batchId={upload.batchId} />
        ) : (
          <BatchUploader jobId={jobId} upload={upload} />
        )}
      </div>
    </motion.div>
  );
}
