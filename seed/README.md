# Synthetic resume generator

Produces a few hundred realistic PDF resumes across five roles, so you can
exercise the real upload → SQS → worker → scoring pipeline without feeding it
anyone's actual CV.

```bash
pip install reportlab
python generate_resumes.py
```

PDFs land in `seed/resumes/`, grouped by job and batch. Every name, email,
phone number and employer is assembled from pools — none of it describes a real
person.

The same distributions drive the public demo's fixture (see
`client/src/demo/catalog.ts`), which is why the demo data and a locally seeded
run look like the same hiring pipeline.
