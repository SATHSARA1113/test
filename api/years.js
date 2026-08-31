import {getYearList,MEDIUMS,SUBJECTS} from "./common.js";
export default async function handler(req,res){
  try{
    const subject=req.query?.subject,medium=req.query?.medium;
    if(!SUBJECTS[subject]||!MEDIUMS[medium]) return res.status(400).json({error:"Invalid subject or medium."});
    const list=await getYearList(subject,medium);
    res.status(200).json({years:list.map(x=>x.year)});
  }catch(e){
    console.error(e);
    res.status(502).json({error:"Could not read GovDoc. " + e.message});
  }
}
