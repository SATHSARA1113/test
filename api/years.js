import { getYearList } from './common.js';

export default async function handler(req,res){
  try{
    const subject=String(req.query?.subject||'').trim();
    const medium=String(req.query?.medium||'sinhala').trim().toLowerCase();
    const years=await getYearList(subject,medium);
    res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=86400');
    return res.status(200).json({subject,medium,years:years.map(x=>x.year),items:years});
  }catch(e){
    console.error(e);
    return res.status(502).json({error:e?.message||'Unable to read GovDoc right now.'});
  }
}
