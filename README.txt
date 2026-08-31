# Sri Lanka A/L Past Papers — Govdoc direct-download version

This version uses GOVDOC.LK as the source instead of ePapers.

Student flow:
Stream -> Subject -> Year -> Medium -> Paper -> Download PDF

The download endpoint:
`/api/download`

does this:
1. Opens the selected subject's medium page on govdoc.lk.
2. Finds the selected year.
3. Finds the document view page.
4. Resolves Govdoc's actual PDF file.
5. Streams the PDF back through your website with Content-Disposition: attachment.

IMPORTANT:
- This is meant to run on Vercel. Do NOT test by opening index.html with double-click/file://.
- GitHub Pages alone cannot run the API function.
- The site uses only years that the source actually lists; missing years return a clear "Paper unavailable" message.
- Govdoc itself states on its pages that its content is gathered from online sources and that copyright belongs to the responsible owners. Use this only where you have the right to provide the material.

VERCEL DEPLOY:
1. Upload this whole project/folder to a GitHub repository, OR import the folder directly into Vercel.
2. Deploy.
3. Open the Vercel URL.
4. Test: Chemistry -> 2024 -> English -> Paper I/Part 1 -> Download PDF.

For a no-code beginner, GitHub + Vercel is the easiest setup for this specific direct-download version.
