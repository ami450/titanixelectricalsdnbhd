// Server-side only. Set OPENAI_API_KEY in Netlify environment variables.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return {statusCode:405,body:'Method not allowed'};
  if (!process.env.OPENAI_API_KEY) return {statusCode:503,body:JSON.stringify({error:'AI not configured'})};
  try {
    if ((event.body||'').length > 6000) return {statusCode:413,body:'Request too large'};
    const body=JSON.parse(event.body||'{}');
    const message=String(body.message||'').trim().slice(0,500);
    if(!message)return {statusCode:400,body:'Message required'};
    const history=Array.isArray(body.history)?body.history.slice(-6).filter(m=>['user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,500)})):[];
    const system=`You are the Malay-first customer information assistant for TITANIX ELECTRICAL SDN. BHD., an electrical and Pro Solar services company in Shah Alam, Malaysia. Phone and WhatsApp 011-1182 3643, email nidanish196@gmail.com, address No. 18, Jalan Elektron U16/88, Seksyen U16, 40160 Shah Alam, Selangor. Vision: customer comfort. Mission: customer safety. Services: electrical wiring, maintenance, electrical safety checks, project coordination, preliminary solar consultation. Be concise and helpful in the user's language. Never invent prices, approvals, qualifications, licenses, project portfolio, or appointments. Solar calculator estimates are illustrative, not guarantees. For quotations and bookings direct user to WhatsApp; no online payments. For electrical hazards advise avoiding contact and seeking qualified help or emergency services. Never ask for passwords or sensitive data. Do not claim to have submitted bookings.`;
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
    let resp;try{resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',messages:[{role:'system',content:system},...history,{role:'user',content:message}],max_tokens:300,temperature:0.3}),signal:controller.signal})}finally{clearTimeout(timer)}
    if(!resp.ok)return {statusCode:502,body:JSON.stringify({error:'AI service unavailable'})};
    const data=await resp.json();const reply=data.choices?.[0]?.message?.content;
    if(typeof reply!=='string')throw Error('Missing response');
    return {statusCode:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify({reply:reply.slice(0,1800)})};
  }catch(e){return {statusCode:500,body:JSON.stringify({error:'Chat temporarily unavailable'})}}
};
