import {getYears,SUBJECTS,MEDIUMS} from "./common.js";
export default async function handler(req,res){
  try{
    const subject=req.query?.subject,medium=req.query?.medium;
    if(!SUBJECTS[subject]||!MEDIUMS[medium])return res.status(400).json({error:"Invalid selection."});
    const result=await getYears(subject,medium);
    return res.status(200).json({years:result.years});
  }catch(e){
    console.error(e);
    return res.status(502).json({error:e.message});
  }
}
