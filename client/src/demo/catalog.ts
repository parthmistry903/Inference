/**
 * DEMO-ONLY · The source content the fixture is generated from.
 *
 * Mirrors the distributions in `seed/generate_resumes.py`, which is the script
 * that produced the synthetic resume PDFs the real pipeline was tested against.
 * Nothing here describes a real person: names, emails and phone numbers are
 * assembled from pools, and every company/college pairing is coincidental.
 */

export type ArchetypeKey =
  | 'elite'
  | 'strong'
  | 'average'
  | 'weak'
  | 'switcher'
  | 'freelancer'
  | 'backendFresher'
  | 'apm'
  | 'sre'
  | 'junior'
  | 'researcher'
  | 'freshGrad';

export interface Archetype {
  /** Years of experience range. */
  years: [number, number];
  /** Fraction of the job's *required* skills this candidate actually has. */
  coverage: [number, number];
  /** Extra non-required skills listed on the resume. */
  extras: [number, number];
  /** The LLM's 0-10 subjective fit score. */
  fit: [number, number];
  /** Bias toward the top (elite schools, first entries) or tail of the pool. */
  educationBias: 'top' | 'any' | 'tail';
  /** Believable years between graduating and the experience claimed. */
  maxCareerGap: number;
  /** Voice used when writing this candidate's AI summary. */
  seniority: string;
}

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  elite:          { years: [5.0, 9.0], coverage: [0.82, 1.0],  extras: [3, 6], fit: [8, 10], educationBias: 'top',  maxCareerGap: 3, seniority: 'Senior' },
  strong:         { years: [3.2, 6.0], coverage: [0.60, 0.82], extras: [2, 5], fit: [6, 8],  educationBias: 'any',  maxCareerGap: 3, seniority: 'Mid-level' },
  average:        { years: [2.0, 4.6], coverage: [0.38, 0.62], extras: [1, 4], fit: [4, 6],  educationBias: 'any',  maxCareerGap: 5, seniority: 'Mid-level' },
  weak:           { years: [0.6, 2.4], coverage: [0.14, 0.38], extras: [1, 3], fit: [2, 4],  educationBias: 'tail', maxCareerGap: 4, seniority: 'Early-career' },
  switcher:       { years: [1.0, 3.8], coverage: [0.26, 0.50], extras: [2, 5], fit: [3, 5],  educationBias: 'tail', maxCareerGap: 9, seniority: 'Career-switching' },
  freelancer:     { years: [1.4, 4.5], coverage: [0.36, 0.60], extras: [2, 5], fit: [4, 6],  educationBias: 'tail', maxCareerGap: 6, seniority: 'Freelance' },
  backendFresher: { years: [0.5, 1.8], coverage: [0.20, 0.42], extras: [1, 3], fit: [2, 5],  educationBias: 'tail', maxCareerGap: 4, seniority: 'Entry-level' },
  apm:            { years: [1.2, 3.4], coverage: [0.30, 0.54], extras: [1, 4], fit: [3, 6],  educationBias: 'any',  maxCareerGap: 5, seniority: 'Associate' },
  sre:            { years: [4.4, 8.5], coverage: [0.70, 0.92], extras: [3, 6], fit: [7, 9],  educationBias: 'any',  maxCareerGap: 3, seniority: 'Senior' },
  junior:         { years: [0.6, 2.2], coverage: [0.18, 0.40], extras: [1, 3], fit: [2, 4],  educationBias: 'tail', maxCareerGap: 4, seniority: 'Junior' },
  researcher:     { years: [4.0, 8.0], coverage: [0.64, 0.86], extras: [3, 6], fit: [6, 9],  educationBias: 'top',  maxCareerGap: 4, seniority: 'Research-track' },
  freshGrad:      { years: [0.3, 1.4], coverage: [0.22, 0.46], extras: [1, 3], fit: [3, 5],  educationBias: 'tail', maxCareerGap: 3, seniority: 'Graduate' },
};

export const FIRST_NAMES = [
  'Aarav', 'Aryan', 'Aditi', 'Ananya', 'Arjun', 'Ishita', 'Karan', 'Kavya',
  'Meera', 'Nisha', 'Nitin', 'Pooja', 'Rahul', 'Rohan', 'Siddharth', 'Sneha',
  'Tanvi', 'Varun', 'Akhil', 'Divya', 'Harsha', 'Priya', 'Rashmi', 'Swathi',
  'Vikram', 'Lakshmi', 'Pallavi', 'Neeraj', 'Shreya', 'Sanjay', 'Farhan', 'Zoya',
  'Devika', 'Manav', 'Ritika', 'Yash',
];

export const LAST_NAMES = [
  'Sharma', 'Mehta', 'Verma', 'Iyer', 'Nair', 'Kapoor', 'Singh', 'Bose',
  'Kumar', 'Rao', 'Patel', 'Jain', 'Joshi', 'Desai', 'Krishnan', 'Tiwari',
  'Gupta', 'Pillai', 'Chandra', 'Bhatia', 'Menon', 'Roy', 'Saxena', 'Bhatt',
  'Reddy', 'Deshpande', 'Sengupta', 'Kulkarni',
];

export const EMAIL_PROVIDERS = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com'];

export interface BatchSpec {
  /** Sourcing channel, shown nowhere but used to keep the fixture coherent. */
  source: string;
  daysAgo: number;
  total: number;
  failed: number;
  /** `live` starts queued and processes itself while you watch. */
  mode: 'completed' | 'live';
}

export interface JobSpec {
  key: string;
  title: string;
  description: string;
  requiredSkills: string[];
  minExperienceYears: number;
  minEducation: 'any' | 'highschool' | 'bachelor' | 'master' | 'phd';
  status: 'active' | 'closed';
  createdDaysAgo: number;
  /** Role label as it reads mid-sentence in an AI summary. */
  role: string;
  /** Titles the candidate held at previous employers. */
  priorTitles: string[];
  /** Non-required skills that also show up on these resumes. */
  extraSkills: string[];
  companies: string[];
  /** Ordered best-first; `educationBias` picks from the head or tail. */
  education: string[];
  archetypes: (readonly [ArchetypeKey, number])[];
  batches: BatchSpec[];
}

export const JOBS: JobSpec[] = [
  {
    key: 'devops',
    title: 'DevOps Engineer',
    description:
      'Own the deployment pipeline and cloud footprint for a multi-tenant SaaS platform running on AWS. You will build Terraform modules, harden Kubernetes workloads, and cut release lead time from days to hours. On-call rotation is shared across a four-person platform team.',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Prometheus', 'Jenkins'],
    minExperienceYears: 3,
    minEducation: 'bachelor',
    status: 'active',
    createdDaysAgo: 6,
    role: 'DevOps engineer',
    priorTitles: ['DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer', 'Cloud Engineer', 'Infrastructure Engineer'],
    extraSkills: ['Python', 'Bash', 'Grafana', 'Helm', 'ArgoCD', 'GitHub Actions', 'Ansible', 'CloudWatch', 'GitOps', 'Istio', 'Vault', 'Datadog'],
    companies: ['Razorpay', 'Freshworks', 'BrowserStack', 'Meesho', 'PhonePe', 'Paytm', 'Wipro', 'Infosys', 'Mphasis', 'Druva', 'Atlassian India', 'CRED', 'Hasura', 'Zoho', 'Persistent Systems'],
    education: [
      'B.Tech Computer Science — IIT BHU Varanasi, 2015',
      'B.Tech Computer Science — NIT Surathkal, 2016',
      'B.Tech Information Technology — RV College Bengaluru, 2017',
      'M.Tech Distributed Systems — IIIT Bangalore, 2020',
      'Bachelor of Engineering, Computer Science — DTU Delhi, 2018',
      'Bachelor of Science, Computer Science — Kerala University, 2020',
      'B.Tech Electronics & Communication — Osmania University, 2022',
      'Diploma in Computer Engineering — MSBTE Mumbai, 2021',
    ],
    archetypes: [['elite', 11], ['strong', 21], ['average', 31], ['weak', 16], ['sre', 11], ['junior', 10]],
    batches: [
      { source: 'Naukri Applications', daysAgo: 4, total: 12, failed: 0, mode: 'completed' },
      { source: 'GitHub Jobs Candidates', daysAgo: 1, total: 9, failed: 0, mode: 'completed' },
    ],
  },
  {
    key: 'backend',
    title: 'Backend Engineer — Node.js',
    description:
      'Build and operate the transactional services behind our payments and ledger stack. Expect deep work on queue-driven pipelines, idempotency, schema design and API contracts consumed by three client teams. Strong opinions about testing are welcome.',
    requiredSkills: ['Node.js', 'TypeScript', 'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
    minExperienceYears: 3,
    minEducation: 'bachelor',
    status: 'active',
    createdDaysAgo: 41,
    role: 'backend engineer',
    priorTitles: ['Backend Engineer', 'Node.js Developer', 'Software Engineer', 'API Developer', 'Full Stack Developer'],
    extraSkills: ['Kafka', 'RabbitMQ', 'Kubernetes', 'REST APIs', 'GraphQL', 'JWT', 'OAuth2', 'Git', 'MySQL', 'Swagger', 'Jest', 'gRPC', 'Prisma'],
    companies: ['Razorpay', 'Freshworks', 'Infosys', 'Amazon', 'Zepto', 'Ola', 'PayU', 'Wipro', 'Meesho', 'Chargebee', 'Capgemini', 'Mphasis', 'Tech Mahindra', 'Postman', 'BrowserStack'],
    education: [
      'B.Tech Computer Science — IIT Delhi, 2016',
      'M.Tech Computer Science — IIIT Hyderabad, 2021',
      'B.Tech Computer Science — NIT Trichy, 2017',
      'Bachelor of Engineering, Computer Science — Anna University, 2018',
      'B.Tech Information Technology — VTU Belagavi, 2020',
      'Bachelor of Science, Information Technology — Gujarat University, 2021',
      'Full-Stack Developer Bootcamp — Crio.Do, 2023',
    ],
    archetypes: [['elite', 12], ['strong', 22], ['average', 30], ['weak', 17], ['switcher', 12], ['backendFresher', 7]],
    batches: [
      { source: 'LinkedIn Applications', daysAgo: 26, total: 12, failed: 0, mode: 'completed' },
      { source: 'Instahyre Applications', daysAgo: 3, total: 13, failed: 0, mode: 'live' },
    ],
  },
  {
    key: 'react',
    title: 'Senior React Developer',
    description:
      'Lead the front-end of our customer-facing web app: a design system used by four squads, a checkout flow that carries most of our revenue, and a performance budget we actually enforce. You will pair with design weekly and own accessibility outcomes.',
    requiredSkills: ['React', 'TypeScript', 'Redux', 'Next.js', 'Jest', 'REST APIs'],
    minExperienceYears: 4,
    minEducation: 'bachelor',
    status: 'active',
    createdDaysAgo: 58,
    role: 'frontend developer',
    priorTitles: ['Senior Frontend Engineer', 'Frontend Engineer', 'UI Engineer', 'React Developer', 'Frontend Developer'],
    // Deliberately excludes near-misses like "Redux Toolkit" / "React Query":
    // the scorer matches on word boundaries, so those would count as a hit for
    // "Redux" / "React" and blur the archetype coverage bands.
    extraSkills: ['JavaScript', 'Tailwind CSS', 'Cypress', 'HTML', 'CSS', 'Storybook', 'Webpack', 'Vite', 'Framer Motion', 'Accessibility', 'Playwright', 'Zustand', 'Vitest', 'GraphQL'],
    companies: ['Swiggy', 'Zepto', 'Myntra', 'Groww', 'Freshworks', 'HCL Technologies', 'Infosys', 'TCS', 'Paytm', 'CRED', 'Wipro', 'Flipkart', 'MakeMyTrip', 'Zoho', 'Practo'],
    education: [
      'B.Tech Computer Science — NIT Trichy, 2016',
      'B.Tech Computer Science and Engineering — Amity University, 2017',
      'Bachelor of Engineering, Information Technology — Pune University, 2018',
      'M.Tech Software Engineering — BITS Pilani, 2021',
      'B.Tech Electronics & Communication — DTU Delhi, 2020',
      'Bachelor of Science, Computer Science — Mumbai University, 2022',
      'Full-Stack Web Development Bootcamp — Masai School, 2023',
    ],
    archetypes: [['elite', 13], ['strong', 21], ['average', 29], ['weak', 19], ['switcher', 10], ['freelancer', 8]],
    batches: [
      { source: 'LinkedIn Applications — Week 1', daysAgo: 47, total: 10, failed: 0, mode: 'completed' },
      { source: 'Naukri Applications — Week 2', daysAgo: 33, total: 10, failed: 1, mode: 'completed' },
      { source: 'Employee Referrals — Internal Drive', daysAgo: 5, total: 10, failed: 0, mode: 'completed' },
    ],
  },
  {
    key: 'pm',
    title: 'Product Manager — Growth',
    description:
      'Own activation and retention for a consumer app with eight million monthly users. You will run a continuous experiment backlog, work directly in the data, and be accountable for two north-star metrics rather than a feature roadmap.',
    requiredSkills: ['Product Strategy', 'A/B Testing', 'SQL', 'User Research', 'Roadmapping', 'Amplitude', 'OKRs'],
    minExperienceYears: 4,
    minEducation: 'master',
    status: 'active',
    createdDaysAgo: 62,
    role: 'product manager',
    priorTitles: ['Product Manager', 'Associate Product Manager', 'Senior Product Manager', 'Product Analyst', 'Growth Manager'],
    extraSkills: ['Figma', 'Agile', 'JIRA', 'Mixpanel', 'Looker', 'Tableau', 'CleverTap', 'Metrics Analysis', 'Funnel Analysis', 'Stakeholder Management', 'Segment'],
    companies: ['PhonePe', 'Paytm', 'Swiggy', 'Nykaa', 'Freshworks', 'Zoho', 'Ola', 'Rapido', 'LeadSquared', 'PolicyBazaar', 'Practo', 'Unacademy', 'Hotstar', 'Zetwerk', 'Udaan'],
    education: [
      'MBA — IIM Ahmedabad, 2022',
      'MBA — IIM Bangalore, 2019',
      'B.Tech + MBA — IIT Bombay, 2020',
      'MBA Marketing — NMIMS Mumbai, 2021',
      'MBA — Symbiosis Pune, 2020',
      'MBA — Welingkar Mumbai, 2023',
      'B.Tech Computer Science — VIT Vellore, 2018',
    ],
    archetypes: [['elite', 10], ['strong', 21], ['average', 32], ['weak', 18], ['switcher', 10], ['apm', 9]],
    batches: [
      { source: 'AngelList Candidates', daysAgo: 52, total: 10, failed: 0, mode: 'completed' },
      { source: 'LinkedIn Premium Candidates', daysAgo: 38, total: 10, failed: 1, mode: 'completed' },
      { source: 'Referral Drive Candidates', daysAgo: 11, total: 10, failed: 0, mode: 'completed' },
    ],
  },
  {
    key: 'ds',
    title: 'Data Scientist — ML Platform',
    description:
      'Take models from notebook to production on our internal ML platform: feature pipelines in Airflow, batch and online scoring, and honest offline evaluation. The role is half modelling, half platform engineering, and we care about the second half.',
    requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'Scikit-learn', 'PyTorch', 'SQL', 'Airflow', 'Spark'],
    minExperienceYears: 3,
    minEducation: 'master',
    status: 'closed',
    createdDaysAgo: 74,
    role: 'data scientist',
    priorTitles: ['Data Scientist', 'Machine Learning Engineer', 'Data Analyst', 'Research Engineer', 'Applied Scientist'],
    extraSkills: ['NumPy', 'TensorFlow', 'Statistics', 'AWS SageMaker', 'XGBoost', 'Matplotlib', 'Seaborn', 'MLflow', 'FastAPI', 'OpenCV', 'NLP', 'Docker', 'dbt'],
    companies: ['Flipkart', 'Amazon India', 'Mu Sigma', 'Qure.ai', 'Paytm', 'Fractal Analytics', 'InMobi', 'Lendingkart', 'OfBusiness', 'Delhivery', 'Microsoft IDC', 'Swiggy', 'Zetwerk', 'Meesho'],
    education: [
      'PhD Computer Science (Machine Learning) — IISc Bengaluru, 2018',
      'M.Tech Computer Science (ML) — IIT Delhi, 2019',
      'M.Tech Artificial Intelligence — IIT Gandhinagar, 2020',
      'Master of Science, Statistics — IIT Bombay, 2021',
      'M.Tech Industrial Engineering — NIT Trichy, 2021',
      'Master of Science, Data Science — Jadavpur University, 2022',
      'B.Tech Computer Science — IIT Kanpur, 2022',
    ],
    archetypes: [['elite', 11], ['strong', 21], ['average', 31], ['weak', 15], ['researcher', 11], ['freshGrad', 11]],
    batches: [
      { source: 'LinkedIn Campus + Analytics', daysAgo: 66, total: 12, failed: 0, mode: 'completed' },
      { source: 'IIT/NIT Referrals', daysAgo: 44, total: 10, failed: 1, mode: 'completed' },
    ],
  },
];

/** Why a PDF failed to parse. Mirrors the worker's real failure reasons. */
export const FAILURE_REASONS = [
  'PDF text extraction returned no content — the file is a scanned image and needs OCR.',
  'Password-protected PDF — the worker could not open the document.',
  'Extracted text was under the 200-character minimum required for scoring.',
];

/** Private HR notes, keyed by the decision they accompany. */
export const HR_NOTES: Record<'shortlisted' | 'rejected' | 'review', string[]> = {
  shortlisted: [
    'Screen call went well — clear communicator, walked through a real incident end to end. Moving to the technical round.',
    'Strongest profile in this batch. Referred by {referrer} on the platform team.',
    'Depth is real, not resume padding. Booked for the systems-design round on Thursday.',
    'Notice period is 30 days, which works. Comp expectation is inside band.',
    'Portfolio holds up under scrutiny. Fast-tracking past the take-home.',
  ],
  rejected: [
    'Strong on paper but could not explain their own architecture decisions in the screen. Passing.',
    'Looking for a fully remote role; this one is hybrid three days a week. Mismatch, not a quality issue.',
    'Withdrew — accepted an offer elsewhere before our loop started.',
    'Experience is real but almost entirely in a different domain. Ramp would be too long for this req.',
    'Comp expectation is roughly 40% above band. Revisit if the band moves.',
  ],
  review: [
    'Borderline on years but the project work is genuinely good. Want a second opinion from the hiring manager.',
    'Skills line up; the gap is depth. Holding until we see the rest of this batch.',
    'Good fundamentals, thin production exposure. Would need a strong mentor on the team.',
    'Waiting on the take-home before deciding either way.',
  ],
};

export const REFERRERS = ['Priya', 'Vikram', 'Ananya', 'Rohan', 'Meera'];
