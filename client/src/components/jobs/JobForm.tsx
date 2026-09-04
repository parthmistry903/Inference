import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { X, Plus } from 'lucide-react';
import { Input, LabeledField, TextArea } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../ui/Toast';
import type { Job } from '../../types';
/* DEMO-ONLY:START */
import { DEMO_MODE } from '../../demo/demoConfig';
import { DemoNotice } from '../../demo/DemoUI';
/* DEMO-ONLY:END */

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
  minExperienceYears: z.coerce.number().min(0).max(30),
  minEducation: z.enum(['any', 'highschool', 'bachelor', 'master', 'phd']),
});
type JobFormValues = z.infer<typeof schema>;

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  job?: Job | null;
}

export function JobForm({ open, onClose, job }: JobFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(job?.requiredSkills ?? []);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<JobFormValues>({
    resolver: zodResolver(schema),
    defaultValues: job
      ? { title: job.title, description: job.description, minExperienceYears: job.minExperienceYears, minEducation: job.minEducation }
      : { minExperienceYears: 0, minEducation: 'any' },
  });

  useEffect(() => {
    if (open) {
      if (job) {
        reset({ title: job.title, description: job.description, minExperienceYears: job.minExperienceYears, minEducation: job.minEducation });
        setSkills(job.requiredSkills);
      } else {
        reset({ title: '', description: '', minExperienceYears: 0, minEducation: 'any' });
        setSkills([]);
      }
      setSkillInput('');
    }
  }, [job, open, reset]);

  const mutation = useMutation({
    mutationFn: (values: JobFormValues & { requiredSkills: string[] }) =>
      job ? api.put<Job>(`/jobs/${job._id}`, values) : api.post<Job>('/jobs', values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast(job ? 'Job updated successfully' : 'Job created successfully', 'success');
      onClose();
    },
    onError: (error) => toast(getApiErrorMessage(error), 'error'),
  });

  const addSkill = () => {
    const normalized = skillInput.trim();
    if (!normalized) return;
    if (skills.length >= 30) { toast('Max 30 skills allowed', 'warning'); return; }
    if (!skills.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
      setSkills((cur) => [...cur, normalized]);
    }
    setSkillInput('');
  };

  const onSubmit = (values: JobFormValues) => {
    if (skills.length === 0) { toast('Add at least one skill', 'error'); return; }
    mutation.mutate({ ...values, requiredSkills: skills });
  };

  return (
    <Modal open={open} onClose={onClose} title={job ? 'Edit Job Posting' : 'New Job Posting'}>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* DEMO-ONLY:START */}
        {DEMO_MODE && (
          <DemoNotice>
            Fill this in and submit to see the flow — saving is disabled, because writing a job
            posting needs a live MongoDB Atlas connection. The five sample roles are read-only.
          </DemoNotice>
        )}
        {/* DEMO-ONLY:END */}

        <LabeledField label="Job Title" error={errors.title?.message}>
          <Input placeholder="Senior Frontend Engineer" {...register('title')} />
        </LabeledField>

        <LabeledField label="Description" error={errors.description?.message}>
          <TextArea placeholder="Describe the role, expectations, and team context..." {...register('description')} className="min-h-[120px]" />
        </LabeledField>

        <LabeledField label="Required Skills">
          <div className="flex gap-3">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill and press Enter"
            />
            <Button type="button" variant="ghost" className="bg-white/5 border border-white/10 hover:bg-white/10" onClick={addSkill} leftIcon={<Plus className="h-4 w-4" />}>
              Add
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  type="button"
                  key={skill}
                  className="inline-flex items-center gap-2 rounded-full border border-[#2A2420] bg-transparent px-3 py-1.5 font-medium text-sm text-[#928D88] transition-all hover:bg-white/5 hover:text-[#EDEAE5]"
                  onClick={() => setSkills((cur) => cur.filter((s) => s !== skill))}
                  title={`Remove ${skill}`}
                >
                  {skill}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </LabeledField>

        <div className="grid gap-5 sm:grid-cols-2 bg-white/5 p-5 rounded-2xl border border-white/5">
          <LabeledField label="Min. Experience (years)" error={errors.minExperienceYears?.message}>
            <Input type="number" min={0} max={30} {...register('minExperienceYears')} className="bg-black/20" />
          </LabeledField>
          <LabeledField label="Min. Education" error={errors.minEducation?.message}>
            <select
              className="h-11 w-full rounded-xl glass-input px-3 font-medium text-primary outline-none transition-all focus:ring-2 focus:ring-[#3A7A72] bg-[#12100E]"
              {...register('minEducation')}
            >
              <option value="any">Any</option>
              <option value="highschool">High School</option>
              <option value="bachelor">Bachelor</option>
              <option value="master">Master</option>
              <option value="phd">PhD</option>
            </select>
          </LabeledField>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            <Logo className="h-5 w-5 text-[#3A7A72]" />
            AI criteria will auto-generate
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:text-primary">Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {job ? 'Save Changes' : 'Create Job'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
