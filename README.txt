# Sri Lanka A/L Past Papers — GovDoc fixed direct download

FIXED:
- Removed incorrect guessed GovDoc page URLs.
- Removed fake Part 1 / Part 2 logic.
- The student chooses: Subject -> Year -> Medium -> Download.
- The API follows GovDoc's real current flow:
  year page -> medium link -> /view?fid=... -> /download/... -> /downloadFile/<numeric-id>
- The PDF is then returned by this website as an attachment.

For example, GovDoc's 2025 Physics page links to a Sinhala view page, and that view page's Download action resolves to `downloadFile/11651`.

DEPLOY:
Use Vercel. Do not open index.html by double-clicking.
