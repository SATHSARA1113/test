# GovDoc direct-download final fix

This build fixes the "No papers found" problem caused by parsing GovDoc as HTML on a Vercel server.

It uses GovDoc's public medium page as the source, reads the page through a text reader, finds the real year -> `view?fid=...` link, then resolves the actual `/downloadFile/<id>` document and returns it through your Vercel site.

Test:
Physics -> Sinhala -> 2025 -> Download PDF
Physics -> English -> 2024 -> Download PDF

Note:
If GovDoc itself has a wrong or missing document for a year/medium, the site will refuse to return an unrelated PDF rather than giving students the wrong subject.
