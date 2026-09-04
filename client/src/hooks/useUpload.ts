import { useCallback, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useToast } from '../components/ui/Toast';
import type { PresignedUploadResponse } from '../types';

type FileStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';
type UploadPhase = 'idle' | 'uploading' | 'confirming' | 'processing';

function fileKey(file: File): string {
  return `${file.name}:${file.size}`;
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf');
}

export function useUpload() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileStatus>>(new Map());
  const [batchId, setBatchId] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  const uploadedCount = useMemo(
    () => Array.from(fileStatuses.values()).filter((status) => status === 'uploaded').length,
    [fileStatuses],
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: File[] = [];
      for (const file of newFiles) {
        if (!isPdf(file)) {
          toast(`${file.name} is not a PDF`, 'error');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast(`${file.name} is larger than 10MB`, 'error');
          continue;
        }
        validFiles.push(file);
      }
      setFiles((current) => {
        const existingKeys = new Set(current.map(fileKey));
        const additions = validFiles.filter((file) => !existingKeys.has(fileKey(file)));
        if (additions.length < validFiles.length) toast('Duplicate files were skipped', 'info');
        return [...current, ...additions].slice(0, 500);
      });
    },
    [toast],
  );

  const removeFile = useCallback((name: string) => {
    setFiles((current) => current.filter((file) => file.name !== name));
    setFileStatuses((current) => {
      const next = new Map(current);
      for (const key of next.keys()) {
        if (key.startsWith(`${name}:`)) next.delete(key);
      }
      return next;
    });
  }, []);

  const startUpload = useCallback(
    async (jobId: string) => {
      if (files.length === 0) return;
      setError(null);
      setPhase('uploading');
      setFileStatuses(new Map(files.map((file) => [fileKey(file), 'pending'])));

      try {
        const presigned = await api.post<PresignedUploadResponse>('/upload/presigned', {
          jobId,
          files: files.map((file) => ({
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/pdf',
          })),
        });
        setBatchId(presigned.batchId);

        const uploadResults = await Promise.allSettled(
          files.map(async (file) => {
            const key = fileKey(file);
            setFileStatuses((current) => new Map(current).set(key, 'uploading'));
            const target = presigned.files.find((f) => f.originalFileName === file.name);
            if (!target) throw new Error(`Presigned URL not found for ${file.name}`);
            const response = await fetch(target.presignedUrl, {
              method: 'PUT',
              headers: target.uploadHeaders,
              body: file,
            });
            if (!response.ok) {
              throw new Error(`Upload failed for ${file.name}`);
            }
            setFileStatuses((current) => new Map(current).set(key, 'uploaded'));
          }),
        );

        const failed = uploadResults.filter((result) => result.status === 'rejected');
        if (failed.length > 0) {
          setFileStatuses((current) => {
            const next = new Map(current);
            files.forEach((file) => {
              if (next.get(fileKey(file)) === 'uploading') next.set(fileKey(file), 'failed');
            });
            return next;
          });
          toast('Some files failed to upload. Retrying is not supported - please try again.', 'error');
          setError('Some files failed to upload');
        }

        if (failed.length === 0) {
          setPhase('confirming');
          await api.post<{ batchId: string; totalQueued: number }>('/upload/confirm', { batchId: presigned.batchId });
          toast('Resumes queued for screening', 'success');
          setPhase('processing');
        } else {
          setPhase('idle');
        }
      } catch (uploadError) {
        const message = getApiErrorMessage(uploadError);
        setError(message);
        toast(message, 'error');
        setPhase('idle');
      }
    },
    [files, toast],
  );

  return {
    files,
    fileStatuses,
    batchId,
    phase,
    error,
    uploadedCount,
    addFiles,
    removeFile,
    startUpload,
  };
}
