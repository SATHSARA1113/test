import {resolveView} from "./common.js";

async function getFileId(viewUrl){
  const target=viewUrl.replace(/^https?:\/\//,"");
  const r=await fetch(`https://r.jina.ai/http://${target}`,{
    headers:{"Accept":"text/plain","User-Agent":"Mozilla/5.0 AL-Past-Papers"}
  });
  if(!r.ok) throw new Error(`Could not read GovDoc download page (${r.status}).`);
  const text=await r.text();
  const d=text.match(/https?:\/\/govdoc\.lk\/download\/[a-z0-9]+/i);
  if(d){
    const dr=await fetch(`https://r.jina.ai/http://${d[0].replace(/^https?:\/\//,"")}`,{
      headers:{"Accept":"text/plain","User-Agent":"Mozilla/5.0 AL-Past-Papers"}
    });
    if(!dr.ok) throw new Error("Could not read GovDoc file page.");
    const dt=await dr.text();
    const m=dt.match(/https?:\/\/govdoc\.lk\/downloadFile\/(\d+)/i)||dt.match(/\/downloadFile\/(\d+)/i);
    if(m)return m[1];
  }
  // Some reader responses expose the file ID directly in the view page.
  const direct=text.match(/\/downloadFile\/(\d+)/i);
  if(direct)return direct[1];
  throw new Error("Could not find the actual PDF file on GovDoc.");
}

export default async function handler(req,res){
  try{
    const {subject,year,medium}=req.query||{};
    const view=await resolveView(subject,String(year),String(medium));
    const id=await getFileId(view);
    const pdf=await fetch(`https://govdoc.lk/downloadFile/${id}`,{
      redirect:"follow",
      headers:{
        "User-Agent":"Mozilla/5.0 AL-Past-Papers",
        "Accept":"application/pdf,*/*"
      }
    });
    if(!pdf.ok)throw new Error(`GovDoc PDF server returned ${pdf.status}.`);
    const buf=Buffer.from(await pdf.arrayBuffer());
    res.statusCode=200;
    res.setHeader("Content-Type",pdf.headers.get("content-type")||"application/pdf");
    res.setHeader("Content-Disposition",`attachment; filename="${year}-${String(subject).toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${medium}.pdf"`);
    return res.send(buf);
  }catch(e){
    console.error(e);
    return res.status(404).send(`Paper unavailable: ${e.message}`);
  }
}
