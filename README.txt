# Sri Lanka A/L Past Papers — GOVDOC direct download (fixed)

This is the repaired build.

FIXES:
- Uses the real GovDoc medium page URLs.
- Finds the real year -> /view?fid=... link from GovDoc instead of guessing URLs.
- Reads only years that actually appear on that live medium page.
- Follows GovDoc's real /download/<token> -> /downloadFile/<numeric-id> flow.
- Streams the resulting PDF back from your Vercel site as a browser download.
- No fake Part 1 / Part 2 selection.

Test:
Physics -> English -> choose 2024 -> Download PDF
Physics -> Sinhala -> choose 2025 -> Download PDF
Combined Mathematics -> Sinhala -> choose a year actually listed -> Download PDF

IMPORTANT:
This requires Vercel (or another Node/serverless host). Do not use file://.
