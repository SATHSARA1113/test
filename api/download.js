const PAPERS = {
  Physics: {
    sinhala: {2010:2127,2014:2128,2015:1622,2016:1648,2017:1679,2018:2146,2019:1883,2020:1877,2021:3627,2022:6887,2023:8205,2024:10083,2025:11651,2026:12410},
    english: {2018:1726,2019:1806,2020:1879,2021:3628,2022:6925,2023:10086,2026:12401}
  }
};

function safeName(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}

export default async function handler(req,res){
  try{
    const {subject,year,medium}=req.query||{};
    const id=PAPERS?.[subject]?.[medium]?.[Number(year)];
    if(!id) return res.status(404).send("That paper is not mapped or verified on GovDoc.");
    const r=await fetch(`https://govdoc.lk/downloadFile/${id}`,{
      redirect:"follow",
      headers:{
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        "Accept":"application/pdf,*/*"
      }
    });
    if(!r.ok) return res.status(502).send(`GovDoc returned ${r.status}.`);
    const buf=Buffer.from(await r.arrayBuffer());
    const type=r.headers.get("content-type")||"application/pdf";
    // Safety check: if GovDoc says it is not a PDF, do not send an HTML page as a .pdf.
    if(!type.toLowerCase().includes("pdf")) return res.status(502).send("GovDoc did not return a PDF file.");
    res.statusCode=200;
    res.setHeader("Content-Type",type);
    res.setHeader("Content-Disposition",`attachment; filename="${year}-${safeName(subject)}-${medium}.pdf"`);
    res.setHeader("Cache-Control","private, max-age=600");
    return res.send(buf);
  }catch(e){
    console.error(e);
    return res.status(500).send("Download failed. Please try again.");
  }
}
