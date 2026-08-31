export default async function handler(req,res){
 return res.status(410).json({error:"This build uses verified static paper mappings."});
}
