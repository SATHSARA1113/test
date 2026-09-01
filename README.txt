# Sri Lanka A/L Past Papers — GovDoc connected build

This build keeps the verified static Physics file mappings and adds live GovDoc lookup for other connected A/L subjects.

Connected subjects in the main UI:
- Combined Mathematics
- Physics
- Chemistry
- Biology

How it works:
1. The user selects a subject and medium.
2. /api/years reads the matching GovDoc subject page and extracts the year + GovDoc file id.
3. The selected paper is downloaded through /api/download on this Vercel project.
4. Physics keeps its existing verified static IDs as a fallback/protection against changes to the Physics page.

Deployment:
- Deploy the folder to Vercel.
- Do not open index.html with file://; use the Vercel URL so /api routes work.
