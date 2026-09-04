"""
Inference — Realistic Resume PDF Generator
Creates varied, imperfect, job-specific resume PDFs for bulk screening tests.

Run:
    python3 seed/generate_resumes_v2.py
"""

from __future__ import annotations

import os
import random
import re
from pathlib import Path
from typing import Dict, List, Any

from reportlab.lib import colors
import reportlab.rl_config
reportlab.rl_config.pageCompression = 0
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
)

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

SEED = 42
random.seed(SEED)

BASE_DIR = Path(__file__).resolve().parent
OUT_DIR = BASE_DIR / "resumes"

ACCENT = colors.HexColor("#1A1A2E")
YELLOW = colors.HexColor("#F7D51D")
GREEN = colors.HexColor("#A8E6A3")
BLUE = colors.HexColor("#9AD8FF")
LIGHT = colors.HexColor("#F6F3EC")
DARK = colors.HexColor("#141414")
MUTED = colors.HexColor("#6B6B6B")
BORDER = colors.HexColor("#202020")

# -----------------------------------------------------------------------------
# HELPERS
# -----------------------------------------------------------------------------

def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return re.sub(r"_+", "_", value).strip("_")


def weighted_choice(items: List[tuple]):
    choices = [x[0] for x in items]
    weights = [x[1] for x in items]
    return random.choices(choices, weights=weights, k=1)[0]


def maybe(p: float) -> bool:
    return random.random() < p


def pick(seq):
    return random.choice(seq)


def join_skills(skills: List[str]) -> str:
    return " · ".join(skills)


def imperfect_skill_format(skills: List[str]) -> List[str]:
    variants = []
    for s in skills:
        if maybe(0.15):
            variants.append(s.lower())
        elif maybe(0.10):
            variants.append(s.replace("TypeScript", "TS"))
        elif maybe(0.10):
            variants.append(s.replace("React", "React.js"))
        elif maybe(0.08):
            variants.append(s.replace("Node.js", "Node"))
        else:
            variants.append(s)
    return variants


def add_resume_noise(text: str) -> str:
    """Add small imperfections so the dataset feels human."""
    replacements = [
        ("optimized", "optimised"),
        ("organization", "organisation"),
        ("coordinated", "co-ordinated"),
        ("developed", "built"),
        ("implemented", "added"),
    ]
    for old, new in replacements:
        if maybe(0.20):
            text = text.replace(old, new)

    if maybe(0.20):
        text = text.replace("high-performance", "high performance")

    if maybe(0.15):
        text = text.replace("  ", " ")

    return text


def maybe_gap_line() -> str | None:
    gap_lines = [
        "Career break of 8 months in 2023 for family reasons.",
        "Took a short break while preparing for competitive exams.",
        "Worked freelance for a few months between roles.",
        "Transitioned from support/testing into development.",
        "No formal internship experience; learned through projects and part-time work.",
    ]
    return pick(gap_lines) if maybe(0.35) else None


def maybe_typo(text: str) -> str:
    if not maybe(0.20):
        return text
    typo_map = {
        "experience": "expereince",
        "developer": "devloper",
        "successful": "succesful",
        "collaboration": "colaboration",
        "responsible": "responsable",
    }
    for k, v in typo_map.items():
        if k in text and maybe(0.5):
            text = text.replace(k, v)
    return text


def make_bullets(points: List[str], style: ParagraphStyle) -> List[Paragraph]:
    out = []
    for p in points:
        out.append(Paragraph(f"• {add_resume_noise(maybe_typo(p))}", style))
    return out


# -----------------------------------------------------------------------------
# JOB PROFILES
# -----------------------------------------------------------------------------

JOB_PROFILES: Dict[str, Dict[str, Any]] = {
    "job1_senior_react_developer": {
        "title": "Senior React Developer",
        "batch_sets": [
            ("batch1_linkedin_week1", 10),
            ("batch2_naukri_week2", 10),
            ("batch3_referrals_internal", 10),
        ],
        "skill_pool": [
            "React", "TypeScript", "JavaScript", "Redux", "Redux Toolkit", "Next.js",
            "Tailwind CSS", "Jest", "Cypress", "HTML", "CSS", "Storybook", "GraphQL",
            "REST APIs", "Webpack", "Vite", "React Query", "Framer Motion"
        ],
        "company_pool": [
            "Swiggy", "Zepto", "Myntra", "Groww", "Freshworks", "HCL Technologies",
            "Infosys", "TCS", "Paytm", "CRED", "Wipro", "Flipkart", "MakeMyTrip",
            "Zoho", "Practo", "Dunzo", "StartupXYZ", "ProductLabs"
        ],
        "education_pool": [
            "B.Tech Computer Science — NIT Trichy, 2019",
            "B.E. Information Technology — Pune University, 2020",
            "B.Tech ECE — DTU Delhi, 2021",
            "B.Sc Computer Science — Mumbai University, 2022",
            "Full-Stack Bootcamp — Masai School, 2023",
            "B.Tech CSE — Amity University, 2020",
        ],
        "archetypes": [
            ("elite", 18),
            ("strong", 24),
            ("average", 25),
            ("weak", 16),
            ("switcher", 10),
            ("freelancer", 7),
        ],
    },
    "job2_backend_engineer_nodejs": {
        "title": "Backend Engineer — Node.js",
        "batch_sets": [
            ("batch1_linkedin", 12),
            ("batch2_instahyre", 13),
        ],
        "skill_pool": [
            "Node.js", "TypeScript", "JavaScript", "Express", "MongoDB", "PostgreSQL",
            "Redis", "Kafka", "RabbitMQ", "AWS", "Docker", "Kubernetes", "REST APIs",
            "GraphQL", "JWT", "OAuth2", "Git", "MySQL", "Swagger"
        ],
        "company_pool": [
            "Razorpay", "Freshworks", "Infosys", "Amazon", "Zepto", "Ola", "PayU",
            "Wipro", "Meesho", "Dunzo", "Chargebee", "Capgemini", "Mphasis",
            "Startupez", "Tech Mahindra", "Postman", "BrowserStack", "ScaleRoute"
        ],
        "education_pool": [
            "B.Tech CS — NIT Trichy, 2019",
            "B.Tech CS — IIT Delhi, 2019",
            "B.E. CSE — Anna University, 2020",
            "B.Tech IT — VTU, 2020",
            "B.Sc IT — Gujarat University, 2017",
            "Fullstack Bootcamp — Crio.do, 2022",
        ],
        "archetypes": [
            ("elite", 16),
            ("strong", 25),
            ("average", 27),
            ("weak", 14),
            ("switcher", 12),
            ("backend_fresher", 6),
        ],
    },
    "job3_product_manager_growth": {
        "title": "Product Manager — Growth",
        "batch_sets": [
            ("batch1_angellist", 10),
            ("batch2_linkedin_premium", 10),
            ("batch3_referral_drive", 10),
        ],
        "skill_pool": [
            "Product Strategy", "A/B Testing", "SQL", "Figma", "User Research",
            "Roadmapping", "Agile", "JIRA", "Amplitude", "Mixpanel", "Looker",
            "Tableau", "CleverTap", "Metrics Analysis", "OKRs"
        ],
        "company_pool": [
            "PhonePe", "Paytm", "Swiggy", "Nykaa", "Freshworks", "Zoho", "Ola",
            "Rapido", "LeadSquared", "PolicyBazaar", "Practo", "Byju's", "Unacademy",
            "Hotstar", "Keka HR", "Zetwerk", "Godrej Digital", "Udaan"
        ],
        "education_pool": [
            "MBA — IIM Ahmedabad, 2022",
            "MBA — IIM Bangalore, 2019",
            "MBA — NMIMS Mumbai, 2021",
            "MBA — Symbiosis Pune, 2020",
            "B.Tech + MBA — IIT Bombay, 2020",
            "MBA — Welingkar Mumbai, 2020",
        ],
        "archetypes": [
            ("elite", 14),
            ("strong", 24),
            ("average", 28),
            ("weak", 15),
            ("switcher", 11),
            ("apm", 8),
        ],
    },
    "job4_devops_engineer": {
        "title": "DevOps Engineer",
        "batch_sets": [
            ("batch1_naukri", 12),
            ("batch2_github_jobs", 9),
        ],
        "skill_pool": [
            "AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Python",
            "Bash", "Prometheus", "Grafana", "Helm", "ArgoCD", "Jenkins", "GitHub Actions",
            "Ansible", "CloudWatch", "SRE", "GitOps"
        ],
        "company_pool": [
            "Razorpay", "Freshworks", "BrowserStack", "Meesho", "PhonePe", "Paytm",
            "Wipro", "Infosys", "Mphasis", "Druva", "Atlassian India", "CRED",
            "Snapdeal", "Hasura", "Zoho", "Persistent Systems", "Startup Infra"
        ],
        "education_pool": [
            "B.Tech CS — NIT Surathkal, 2019",
            "B.E. CS — DTU Delhi, 2020",
            "B.Tech ECE — Osmania University, 2022",
            "B.Tech IT — RV College Bengaluru, 2019",
            "B.Sc CS — Kerala University, 2020",
            "B.Tech CS — IIT BHU Varanasi, 2018",
        ],
        "archetypes": [
            ("elite", 15),
            ("strong", 24),
            ("average", 27),
            ("weak", 13),
            ("sre", 12),
            ("junior", 9),
        ],
    },
    "job5_data_scientist_ml": {
        "title": "Data Scientist — ML Platform",
        "batch_sets": [
            ("batch1_linkedin_campus", 12),
            ("batch2_iit_nit_referrals", 10),
        ],
        "skill_pool": [
            "Python", "Machine Learning", "Pandas", "NumPy", "Scikit-learn", "TensorFlow",
            "PyTorch", "SQL", "Statistics", "AWS SageMaker", "XGBoost", "Matplotlib",
            "Seaborn", "Airflow", "MLflow", "Spark", "FastAPI", "OpenCV", "NLP"
        ],
        "company_pool": [
            "Flipkart", "Amazon India", "Mu Sigma", "Qure.ai", "Paytm", "Fractal Analytics",
            "InMobi", "Lendingkart", "OfBusiness", "Reliance Retail", "Delhivery",
            "Microsoft IDC", "Google India", "IIT Research Lab", "Zifo RnD Solutions"
        ],
        "education_pool": [
            "M.Sc Statistics — IIT Bombay, 2021",
            "M.Tech AI — IIT Gandhinagar, 2020",
            "M.Tech CS (ML) — IIT Delhi, 2019",
            "M.Sc Data Science — Jadavpur University, 2022",
            "M.Tech Industrial Engineering — NIT Trichy, 2021",
            "PhD Computer Science (ML) — IISc Bengaluru, 2018",
        ],
        "archetypes": [
            ("elite", 15),
            ("strong", 24),
            ("average", 27),
            ("weak", 12),
            ("researcher", 12),
            ("fresh_grad", 10),
        ],
    },
}

# -----------------------------------------------------------------------------
# TEMPLATES
# -----------------------------------------------------------------------------

FIRST_NAMES = [
    "Aarav", "Aryan", "Aditi", "Ananya", "Arjun", "Ishita", "Karan", "Kavya",
    "Meera", "Nisha", "Nitin", "Pooja", "Rahul", "Rohan", "Siddharth", "Sneha",
    "Tanvi", "Varun", "Akhil", "Divya", "Harsha", "Priya", "Rashmi", "Swathi",
    "Vikram", "Lakshmi", "Pallavi", "Neeraj", "Shreya", "Sanjay"
]

LAST_NAMES = [
    "Sharma", "Mehta", "Verma", "Iyer", "Nair", "Kapoor", "Singh", "Bose",
    "Kumar", "Rao", "Patel", "Jain", "Joshi", "Desai", "Krishnan", "Tiwari",
    "Gupta", "Pillai", "Chandra", "Bhatia", "Menon", "Roy", "Saxena", "Bhatt"
]

CITIES = [
    "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai",
    "Kolkata", "Ahmedabad", "Kochi", "Noida", "Gurugram", "Jaipur",
    "Surat", "Coimbatore", "Lucknow", "Indore", "Nagpur", "Mysuru"
]

SOURCING_CHANNELS = {
    "batch1_linkedin_week1": "LinkedIn Applications — Week 1",
    "batch2_naukri_week2": "Naukri Applications — Week 2",
    "batch3_referrals_internal": "Employee Referrals — Internal Drive",
    "batch1_linkedin": "LinkedIn Applications",
    "batch2_instahyre": "Instahyre Applications",
    "batch1_angellist": "AngelList Candidates",
    "batch2_linkedin_premium": "LinkedIn Premium Candidates",
    "batch3_referral_drive": "Referral Drive Candidates",
    "batch1_naukri": "Naukri Applications",
    "batch2_github_jobs": "GitHub Jobs Candidates",
    "batch1_linkedin_campus": "LinkedIn Campus + Analytics",
    "batch2_iit_nit_referrals": "IIT/NIT Referrals",
}

ARCHETYPE_SUMMARIES = {
    "elite": [
        "Senior {role} with {yoe} years of experience building production systems. Strong ownership, crisp communication, and a track record of shipping high-impact features.",
        "Experienced {role} with deep hands-on delivery across scale, reliability, and quality. Comfortable owning architecture and mentoring junior engineers.",
    ],
    "strong": [
        "{role} with {yoe} years of industry experience. Solid with core stack, dependable delivery, and good collaboration across product and design.",
        "Practical {role} with good fundamentals and a clear bias for shipping. Has worked on user-facing features and internal tooling.",
    ],
    "average": [
        "{role} with {yoe} years experience. Good core skills, some production exposure, and room to grow in architecture and ownership.",
        "{role} with {yoe} years in software. Comfortable delivering routine work and learning newer tools on the job.",
    ],
    "weak": [
        "Early-career {role} with limited production experience. Familiar with the basics and actively learning through projects, documentation, and on-the-job work.",
        "Junior {role} with small-scale project exposure. Has worked on simpler tasks and is looking for stronger mentorship.",
    ],
    "switcher": [
        "Developer transitioning from a different track into this role. Strong fundamentals, but domain-specific depth is still developing.",
        "Career switcher with hands-on project work and a clear interest in growing into the role full-time.",
    ],
    "freelancer": [
        "Freelance {role} with a mix of client work and self-directed projects. Comfortable building end-to-end features but limited enterprise exposure.",
        "Independent {role} with experience across small client projects, landing pages, and internal tools.",
    ],
    "backend_fresher": [
        "Junior backend engineer with a strong interest in APIs, databases, and clean service design. Limited scale experience so far.",
        "Entry-level backend developer with solid basics in Node.js and databases. Looking to deepen production skills.",
    ],
    "apm": [
        "Associate Product Manager with strong execution habits, sharp user empathy, and growing comfort with metrics and experimentation.",
        "Early-career product manager with good collaboration skills and basic data literacy. Building sharper product instincts.",
    ],
    "sre": [
        "Infrastructure-focused engineer with strong reliability instincts, observability habits, and practical DevOps experience.",
        "SRE-minded DevOps engineer comfortable with incident response, alerting, and safe deployments.",
    ],
    "junior": [
        "Junior DevOps engineer with basic cloud and automation exposure. Comfortable following runbooks and learning quickly.",
    ],
    "researcher": [
        "Research-oriented data scientist with strong academic grounding. Interested in modeling, experimentation, and careful evaluation.",
        "ML engineer with research exposure and practical deployment experience. Mix of theory and production work.",
    ],
    "fresh_grad": [
        "Recent graduate with strong fundamentals and project work. Limited industry experience but good learning velocity.",
    ],
}

ROLES = {
    "job1_senior_react_developer": "Frontend Developer",
    "job2_backend_engineer_nodejs": "Backend Engineer",
    "job3_product_manager_growth": "Product Manager",
    "job4_devops_engineer": "DevOps Engineer",
    "job5_data_scientist_ml": "Data Scientist",
}

# -----------------------------------------------------------------------------
# CONTENT GENERATION
# -----------------------------------------------------------------------------

def make_name() -> str:
    return f"{pick(FIRST_NAMES)} {pick(LAST_NAMES)}"


def make_email(name: str) -> str:
    first, last = name.lower().split()[:2]
    providers = ["gmail.com", "outlook.com", "yahoo.com", "protonmail.com"]
    style = weighted_choice([
        ("first.last", 45),
        ("firstlast", 20),
        ("first_initial_last", 20),
        ("mixed", 15),
    ])
    if style == "first.last":
        local = f"{first}.{last}"
    elif style == "firstlast":
        local = f"{first}{last}"
    elif style == "first_initial_last":
        local = f"{first[0]}{last}"
    else:
        local = f"{first}.{last[:1]}{random.randint(10,99)}"
    return f"{local}@{pick(providers)}"


def make_phone() -> str:
    return f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}"


def make_city() -> str:
    return pick(CITIES)


def make_years(role: str, archetype: str) -> float:
    if archetype in {"elite", "researcher", "sre"}:
        return round(random.uniform(4.5, 9.0), 1)
    if archetype in {"strong"}:
        return round(random.uniform(3.0, 6.0), 1)
    if archetype in {"average"}:
        return round(random.uniform(2.0, 5.0), 1)
    if archetype in {"weak", "junior", "fresh_grad"}:
        return round(random.uniform(0.5, 2.5), 1)
    if archetype in {"switcher"}:
        return round(random.uniform(1.0, 4.0), 1)
    if archetype in {"freelancer", "apm"}:
        return round(random.uniform(1.0, 4.5), 1)
    return round(random.uniform(2.0, 6.0), 1)


def education_for(job_key: str, archetype: str, pool: List[str]) -> str:
    if archetype in {"elite", "researcher"} and maybe(0.65):
        return pick(pool[:3])
    if archetype in {"fresh_grad"}:
        return pick([x for x in pool if "202" in x][-3:] or pool)
    if archetype in {"weak", "junior", "switcher"} and maybe(0.50):
        return pick(pool[-3:])
    return pick(pool)


def make_skills(job_key: str, pool: List[str], archetype: str) -> List[str]:
    n = {
        "elite": random.randint(8, 12),
        "strong": random.randint(7, 10),
        "average": random.randint(5, 8),
        "weak": random.randint(4, 6),
        "switcher": random.randint(5, 8),
        "freelancer": random.randint(5, 9),
        "apm": random.randint(5, 9),
        "sre": random.randint(7, 11),
        "junior": random.randint(4, 6),
        "researcher": random.randint(7, 11),
        "fresh_grad": random.randint(4, 7),
    }.get(archetype, 7)

    skills = random.sample(pool, k=min(n, len(pool)))
    skills = imperfect_skill_format(skills)

    if archetype in {"weak", "junior", "fresh_grad"} and maybe(0.60):
        add = random.sample(
            ["Git", "HTML", "CSS", "Basic Python", "Problem Solving", "Communication"],
            k=random.randint(1, 3),
        )
        skills = skills[: max(3, len(skills) - 1)] + add
    return skills[:12]


def experience_points(job_key: str, archetype: str, company: str, yoe: float) -> List[str]:
    role = ROLES[job_key]

    pools = {
        "job1_senior_react_developer": {
            "elite": [
                f"Led a {role.lower()} revamp for {company}, improving conversion by 12%",
                "Built reusable component patterns used by multiple product squads",
                "Reduced re-rendering and bundle size through targeted refactors",
            ],
            "strong": [
                f"Built user-facing screens for {company} with React + TypeScript",
                "Worked with design and QA to ship feature work every sprint",
                "Improved load time through code splitting and memoization",
            ],
            "average": [
                "Built React components for dashboards and internal tools",
                "Fixed bugs and handled feature requests from product teams",
                "Worked with REST APIs and state management libraries",
            ],
            "weak": [
                "Built small UI screens under senior guidance",
                "Fixed CSS issues and simple component bugs",
                "Learned hooks, props, and basic state management",
            ],
            "switcher": [
                "Migrated a few Angular screens to React",
                "Learnt TypeScript and modern frontend workflows on the job",
                "Worked on a mix of maintenance and feature tasks",
            ],
            "freelancer": [
                "Delivered small websites and web apps for local clients",
                "Handled layout, basic interactivity, and deployment",
                "Worked with React, forms, and simple API integrations",
            ],
        },
        "job2_backend_engineer_nodejs": {
            "elite": [
                f"Designed Node.js services for {company} with reliable APIs and clean contracts",
                "Improved latency through Redis caching and query optimisation",
                "Worked on event-driven workflows and operational reliability",
            ],
            "strong": [
                "Built backend APIs for payments, orders, or support workflows",
                "Wrote unit tests and handled schema changes safely",
                "Integrated third-party services and maintained API documentation",
            ],
            "average": [
                "Developed CRUD APIs and maintained existing services",
                "Worked with MongoDB/PostgreSQL and basic auth flows",
                "Handled bug fixes and feature requests in sprint cycles",
            ],
            "weak": [
                "Built simple REST endpoints under supervision",
                "Used Express and MongoDB for small internal tools",
                "Learning testing and production deployment basics",
            ],
            "switcher": [
                "Transitioned from Java/PHP/backend support into Node.js",
                "Worked on APIs, logging, and database access patterns",
                "Still building depth in cloud and service design",
            ],
            "backend_fresher": [
                "Built practice APIs and a few portfolio projects in Node.js",
                "Worked with Express, MongoDB, and simple auth flows",
                "Looking for stronger production exposure and mentorship",
            ],
        },
        "job3_product_manager_growth": {
            "elite": [
                f"Owned growth roadmap at {company}, running experiments across onboarding and retention",
                "Worked closely with engineering, design, and analytics to launch measurable improvements",
                "Built decision-making around funnel data and customer interviews",
            ],
            "strong": [
                "Managed product backlog and shipped iterative improvements",
                "Ran user interviews and worked on metric-driven prioritization",
                "Collaborated with design and engineering across releases",
            ],
            "average": [
                "Wrote PRDs and managed sprint execution",
                "Handled stakeholder coordination and basic metrics tracking",
                "Worked on feature planning and customer feedback collection",
            ],
            "weak": [
                "Supported PMs with research and documentation",
                "Helped maintain backlog and meeting notes",
                "Building stronger data analysis and prioritization skills",
            ],
            "switcher": [
                "Transitioned from engineering into product work",
                "Comfortable with technical specs and execution detail",
                "Still building depth in discovery and experimentation",
            ],
            "apm": [
                "Supported senior PMs on execution and release planning",
                "Worked on requirements, backlog grooming, and research notes",
                "Learning analytics, experimentation, and roadmap ownership",
            ],
        },
        "job4_devops_engineer": {
            "elite": [
                f"Built infra tooling for {company}, improving deployment speed and reliability",
                "Managed observability, alerts, and rollback-safe deployment workflows",
                "Automated repetitive release and environment tasks with IaC",
            ],
            "sre": [
                "Focused on uptime, on-call operations, and incident response",
                "Set up dashboards, alerts, and service health checks",
                "Reduced manual operational load through scripting and automation",
            ],
            "strong": [
                "Worked with AWS, Kubernetes, and CI/CD pipelines",
                "Managed container-based deployments and infra changes",
                "Added monitoring and safer release practices",
            ],
            "average": [
                "Built and maintained build/deploy automation",
                "Handled Linux servers and basic cloud operations",
                "Used Jenkins, Docker, and AWS in day-to-day work",
            ],
            "weak": [
                "Worked with deployment scripts and simple cloud tasks",
                "Supported production systems and routine ops work",
                "Still learning Kubernetes and infrastructure as code",
            ],
            "junior": [
                "Set up basic CI/CD pipelines and local Docker environments",
                "Learning cloud infrastructure and operational workflows",
                "Helped with server monitoring and simple automation",
            ],
        },
        "job5_data_scientist_ml": {
            "elite": [
                f"Built production ML systems at {company} with strong evaluation discipline",
                "Worked across feature engineering, model validation, and deployment",
                "Used experimentation and monitoring to improve model quality over time",
            ],
            "researcher": [
                "Published or assisted in research-oriented ML work",
                "Strong fundamentals in statistics, modeling, and experiment design",
                "Balanced theory with practical implementation",
            ],
            "strong": [
                "Built predictive models and analyzed performance carefully",
                "Worked with Python, pandas, scikit-learn, and SQL",
                "Contributed to dashboards, notebooks, and model experiments",
            ],
            "average": [
                "Developed baseline ML models and performed EDA",
                "Used notebooks, pandas, and scikit-learn in production-adjacent work",
                "Collaborated with analysts and stakeholders on reports",
            ],
            "weak": [
                "Built small ML projects and coursework models",
                "Comfortable with Python basics and standard libraries",
                "Still learning deployment, monitoring, and experiment design",
            ],
            "fresh_grad": [
                "Completed academic projects in ML and statistics",
                "Built toy models and practiced EDA on public datasets",
                "Looking for production experience and stronger mentorship",
            ],
        },
    }

    lines = pools[job_key].get(archetype, pools[job_key]["average"])
    return [add_resume_noise(maybe_typo(p)) for p in lines]


def build_summary(job_key: str, archetype: str, yoe: float) -> str:
    role = ROLES[job_key]
    tpl = pick(ARCHETYPE_SUMMARIES.get(archetype, ARCHETYPE_SUMMARIES["average"]))
    summary = tpl.format(role=role, yoe=yoe)
    if maybe(0.22):
        summary += " Comfortable working with cross-functional teams."
    if maybe(0.18):
        summary += " Open to learning and taking feedback."
    if maybe(0.15):
        summary += " Strong interest in building reliable, scalable systems."
    return add_resume_noise(maybe_typo(summary))


def build_candidate(job_key: str, archetype: str, idx: int, batch: str) -> Dict[str, Any]:
    profile = JOB_PROFILES[job_key]
    role = ROLES[job_key]
    name = make_name()
    yoe = make_years(role, archetype)

    company_1 = pick(profile["company_pool"])
    company_2 = pick([c for c in profile["company_pool"] if c != company_1])

    # same company sometimes for realism
    if maybe(0.20):
        company_2 = company_1

    education = education_for(job_key, archetype, profile["education_pool"])
    skills = make_skills(job_key, profile["skill_pool"], archetype)
    summary = build_summary(job_key, archetype, yoe)

    experience = []
    if yoe >= 4 or archetype in {"elite", "strong", "sre", "researcher"}:
        exp_count = 2
    elif yoe >= 2:
        exp_count = 1 if maybe(0.55) else 2
    else:
        exp_count = 1

    for n in range(exp_count):
        company = company_1 if n == 0 else company_2
        if job_key == "job1_senior_react_developer":
            if n == 0:
                exp_role = weighted_choice([
                    ("Senior Frontend Engineer", 30), ("Frontend Engineer", 30),
                    ("UI Engineer", 15), ("React Developer", 15), ("Frontend Developer", 10)
                ])
            else:
                exp_role = weighted_choice([
                    ("Frontend Developer", 35), ("UI Developer", 30),
                    ("Web Developer", 20), ("React Developer", 15)
                ])
        elif job_key == "job2_backend_engineer_nodejs":
            exp_role = weighted_choice([
                ("Backend Engineer", 35), ("Node.js Developer", 25),
                ("Software Engineer", 20), ("API Developer", 10), ("Full Stack Developer", 10)
            ])
        elif job_key == "job3_product_manager_growth":
            exp_role = weighted_choice([
                ("Product Manager", 45), ("Associate Product Manager", 20),
                ("Senior Product Manager", 20), ("Product Analyst", 15)
            ])
        elif job_key == "job4_devops_engineer":
            exp_role = weighted_choice([
                ("DevOps Engineer", 40), ("SRE Engineer", 25),
                ("Platform Engineer", 20), ("Cloud Engineer", 15)
            ])
        else:
            exp_role = weighted_choice([
                ("Data Scientist", 45), ("ML Engineer", 25),
                ("Data Analyst", 15), ("Research Assistant", 15)
            ])

        points = experience_points(job_key, archetype, company, yoe)
        if n == 0 and archetype in {"weak", "junior", "fresh_grad"} and maybe(0.50):
            points.append("Worked under senior supervision on task breakdown and delivery.")
        if n == 0 and maybe(0.20):
            points.append("Participated in code reviews / stakeholder reviews / weekly syncs.")

        experience.append({
            "role": exp_role,
            "company": company,
            "duration": f"{max(1, int(round(yoe - n * 2)))} yrs",
            "points": points[:3],
        })

    if archetype in {"elite", "strong", "researcher"} and maybe(0.35):
        gap = maybe_gap_line()
        if gap:
            summary += " " + gap

    if archetype in {"weak", "junior", "fresh_grad"} and maybe(0.55):
        summary = summary.replace("comfortable", "comfortable").replace("strong", "good")

    phone = make_phone()
    email = make_email(name)
    city = make_city()

    if archetype in {"elite", "strong"}:
        if maybe(0.25):
            email = f"{slugify(name.split()[0])}.{slugify(name.split()[1])}@gmail.com"
    elif archetype in {"weak", "junior"}:
        if maybe(0.35):
            email = f"{slugify(name.split()[0])}{random.randint(10,99)}@yahoo.com"

    if maybe(0.18):
        summary = summary.replace("—", "-")
    if maybe(0.12):
        summary += " Looking for opportunities."

    candidate = {
        "batch": batch,
        "name": name,
        "email": email,
        "phone": phone,
        "city": city,
        "summary": summary,
        "skills": skills,
        "experience": experience,
        "education": education,
        "yoe": round(yoe, 1),
        "jobKey": job_key,
        "archetype": archetype,
    }

    return candidate


def build_dataset() -> Dict[str, List[Dict[str, Any]]]:
    dataset: Dict[str, List[Dict[str, Any]]] = {}
    for job_key, profile in JOB_PROFILES.items():
        items: List[Dict[str, Any]] = []
        for batch, count in profile["batch_sets"]:
            for i in range(count):
                archetype = weighted_choice(profile["archetypes"])
                c = build_candidate(job_key, archetype, i, batch)
                items.append(c)
        dataset[job_key] = items
    return dataset


# -----------------------------------------------------------------------------
# PDF RENDERING
# -----------------------------------------------------------------------------

def build_resume_pdf(candidate: Dict[str, Any], filepath: Path):
    doc = SimpleDocTemplate(
        str(filepath),
        pagesize=A4,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    name_style = ParagraphStyle(
        "Name",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=ACCENT,
        leading=24,
        spaceAfter=2,
    )
    contact_style = ParagraphStyle(
        "Contact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.8,
        textColor=MUTED,
        leading=11,
        spaceAfter=5,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=ACCENT,
        leading=12,
        spaceBefore=7,
        spaceAfter=4,
        tracking=0.5,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=DARK,
        leading=12.5,
        spaceAfter=3,
    )
    bullet_style = ParagraphStyle(
        "Bullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.9,
        textColor=DARK,
        leading=12,
        leftIndent=10,
        spaceAfter=1.8,
    )
    sub_style = ParagraphStyle(
        "Sub",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.3,
        textColor=DARK,
        leading=11,
        spaceAfter=1,
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.4,
        textColor=MUTED,
        leading=10,
        spaceAfter=2,
    )

    # Header
    story.append(Paragraph(candidate["name"], name_style))
    story.append(
        Paragraph(
            f'{candidate["email"]}  ·  {candidate["phone"]}  ·  {candidate["city"]}, India',
            contact_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1.8, color=YELLOW, spaceAfter=7))

    # Summary
    story.append(Paragraph("PROFESSIONAL SUMMARY", section_style))
    story.append(Paragraph(candidate["summary"], body_style))

    # Skills
    story.append(Paragraph("SKILLS", section_style))
    skills = join_skills(candidate["skills"])
    story.append(Paragraph(skills, body_style))

    # Experience
    story.append(Paragraph("WORK EXPERIENCE", section_style))
    for exp in candidate["experience"]:
        story.append(Paragraph(exp["role"], sub_style))
        story.append(Paragraph(f'{exp["company"]}  |  {exp["duration"]}', meta_style))
        for p in exp["points"]:
            story.extend(make_bullets([p], bullet_style))
        story.append(Spacer(1, 3))

    # Optional gap line
    if maybe(0.20):
        gap = maybe_gap_line()
        if gap:
            story.append(Paragraph("ADDITIONAL CONTEXT", section_style))
            story.append(Paragraph(gap, body_style))

    # Education
    story.append(Paragraph("EDUCATION", section_style))
    story.append(Paragraph(candidate["education"], body_style))

    # Optional note for realism
    if maybe(0.30):
        story.append(Spacer(1, 4))
        story.append(
            Paragraph(
                f'Experience: {candidate["yoe"]} year(s)',
                ParagraphStyle(
                    "Note",
                    parent=styles["Normal"],
                    fontName="Helvetica-Oblique",
                    fontSize=8,
                    textColor=MUTED,
                    leading=10,
                ),
            )
        )

    doc.build(story)


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------

def generate_all():
    dataset = build_dataset()
    total = 0

    for job_key, candidates in dataset.items():
        job_dir = OUT_DIR / job_key
        job_dir.mkdir(parents=True, exist_ok=True)

        for c in candidates:
            batch_dir = job_dir / c["batch"]
            batch_dir.mkdir(parents=True, exist_ok=True)

            filename = f'{slugify(c["name"])}_resume.pdf'
            path = batch_dir / filename
            build_resume_pdf(c, path)
            total += 1
            print(f"✓ {path.relative_to(BASE_DIR)}")

    print(f"\nDone. Generated {total} PDFs.")
    print(f"Output folder: {OUT_DIR}")

    print("\nBatch map:")
    for job_key, profile in JOB_PROFILES.items():
        print(f"  {job_key} -> {profile['title']}")
        for batch, count in profile["batch_sets"]:
            print(f"    {batch}: {count} resumes")


if __name__ == "__main__":
    generate_all()