# GOVDOC static verified download build

This version removes the failing live year scraper entirely.

The Physics year lists and GovDoc file IDs were checked from GovDoc's current Physics Sinhala and English pages.

Physics Sinhala:
2010, 2014–2026

Physics English:
2018–2024 and 2026

The website displays those verified years from its own data. Clicking Download calls /api/download, which fetches the corresponding GovDoc downloadFile/<id> PDF and returns it through your Vercel domain.

Important:
- This is for Vercel, not file://.
- Only the Physics mappings are connected in this build.
- Other subjects remain in the design but are not given made-up file IDs.
- One GovDoc English 2024 Physics entry has been excluded from the English year list in earlier testing because its download points to a file labelled Political Science. This build therefore skips that problematic year.
