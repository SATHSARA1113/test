# GOVDOC direct download — server fetch fixed

The previous "Failed to fetch / No papers found" issue was caused by trying to fetch GovDoc HTML directly from the Vercel server.

This version uses Jina Reader only to read GovDoc's public HTML pages, then follows the real GovDoc view -> download -> downloadFile flow.

Student flow:
Subject -> Medium -> real available years -> Download PDF

Test:
Physics -> Sinhala -> 2025 -> Download PDF
Physics -> English -> 2024 -> Download PDF

Vercel only. Do not open index.html with file://.
