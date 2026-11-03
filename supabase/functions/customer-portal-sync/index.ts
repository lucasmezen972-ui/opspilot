import {createClient} from 'npm:@supabase/supabase-js@2.55.0';
import {deliverCustomerPortalEvent} from '../_shared/customerPortalTransport.ts';

const admin=createClient(Deno.env.get('SUPABASE_URL')??'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'',{auth:{persistSession:false}});
const reply=(status:number,value:unknown)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function sameToken(a:string,b:string):Promise<boolean>{
  if(!a||!b||a.length>256||b.length>256)return false;
  const [one,two]=await Promise.all([a,b].map(value=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
  const left=new Uint8Array(one),right=new Uint8Array(two);let difference=0;
  for(let i=0;i<left.length;i++)difference|=left[i]^right[i];
  return difference===0;
}
Deno.serve(async request=>{
  if(request.method!=='POST')return reply(405,{error:'method_not_allowed'});
  if(request.headers.has('origin'))return reply(403,{error:'server_request_required'});
  try{
    // The existing internal worker token only starts delivery of already-verified records.
    // No request body is accepted as a purchase, tenant id or target URL.
    const {data:expected,error:tokenError}=await admin.from('platform_settings').select('value').eq('key','email_worker_token').maybeSingle();
    if(tokenError||!await sameToken(request.headers.get('x-worker-token')??'',expected?.value?.token??''))return reply(401,{error:'unauthorized'});
    const {data:configuration,error:configurationError}=await admin.rpc('get_customer_portal_sync_config');
    if(configurationError||!configuration?.enabled||!configuration?.signing_key)return reply(503,{error:'sync_unavailable'});
    const {data:batch,error:claimError}=await admin.rpc('claim_customer_portal_events',{p_limit:10});
    if(claimError)return reply(503,{error:'queue_unavailable'});
    let delivered=0,retrying=0,review=0;
    for(const item of batch??[]){
      const result=await deliverCustomerPortalEvent(item.payload,configuration.signing_key);
      const {data:ack,error:ackError}=await admin.rpc('finish_customer_portal_event',{p_id:item.id,p_lease:item.lease,p_result:result.state,p_code:result.code});
      if(ackError||ack!==true){retrying++;continue;}
      if(result.state==='sent')delivered++;else if(result.state==='review')review++;else retrying++;
    }
    return reply(200,{delivered,retrying,review});
  }catch{return reply(503,{error:'sync_unavailable'});}
});
