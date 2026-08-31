import {getYearList} from "./common.js";
export default async function handler(req,res){
  try{
    const subject=req.query?.subject, medium=req.query?.medium;
    const years=await getYearList(subject,medium);
    return res.status(200).json({years:years.map(x=>x.year)});
  }catch(e){
    console.error(e);
    return res.status(502).json({error:"Could not read the live GovDoc paper list. Please try again."});
  }
}
