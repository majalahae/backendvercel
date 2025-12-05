import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","https://rrinfg.xyz");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");
  if(req.method==="OPTIONS") return res.status(200).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method Not Allowed"});
  
  try{
    const {url} = req.body;
    if(!url) return res.status(400).json({error:"URL kosong"});
    const page=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"},redirect:"follow"});
    const html=await page.text();
    const $=cheerio.load(html);

    const title=$('meta[property="og:title"]').attr("content")||$("h1").first().text()||"Tanpa Judul";

    const paragraphs=[];
    $("p").each((i,el)=>{
      const t=$(el).text().trim();
      if(t.length>40 && !t.includes("Baca Juga:")) paragraphs.push(t);
    });
    const caption=paragraphs.slice(0,2).join("\n\n") || $('meta[property="og:description"]').attr("content") || "Tidak ada ringkasan.";

    let imageUrl=$('meta[property="og:image"]').attr("content")||$("img").first().attr("src");
    if(imageUrl && imageUrl.startsWith("//")) imageUrl="https:"+imageUrl;
    else if(imageUrl && imageUrl.startsWith("/")) imageUrl=new URL(url).origin+imageUrl;

    let image_base64=null;
    if(imageUrl){
      try{
        const imgResp=await fetch(imageUrl,{headers:{"User-Agent":"Mozilla/5.0"}});
        if(imgResp.ok){
          const buffer=await imgResp.arrayBuffer();
          image_base64="data:image/jpeg;base64,"+Buffer.from(buffer).toString("base64");
        }
      }catch(e){ console.error("Error fetch image:",e.message);}
    }

    res.status(200).json({title,summary:caption,image_base64});
  }catch(e){ console.error("Error scraping:",e); res.status(500).json({error:e.toString()});}
}
