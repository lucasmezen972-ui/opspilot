export const CUSTOMER_PORTAL_URL = 'https://tradikom.lucas-mezen-972.workers.dev/api/integrations/customer/opspilot';
export type Delivery = {state:'sent'|'retry'|'review';code:string};
export async function deliverCustomerPortalEvent(
  payload: unknown, signingSecret: string, fetcher: typeof fetch = fetch, now=Date.now(),
): Promise<Delivery> {
  if(signingSecret.length<32) return {state:'review',code:'signing_key_unavailable'};
  const raw=JSON.stringify(payload);
  if(new TextEncoder().encode(raw).length>16*1024) return {state:'review',code:'event_too_large'};
  const timestamp=String(now);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(signingSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+raw));
  const signature='v1='+Array.from(new Uint8Array(signed),byte=>byte.toString(16).padStart(2,'0')).join('');
  try {
    const result=await fetcher(CUSTOMER_PORTAL_URL,{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json','x-tradikom-timestamp':timestamp,'x-tradikom-signature':signature},body:raw});
    if(!result.ok) return {state:result.status>=500||result.status===429?'retry':'review',code:'portal_http_'+result.status};
    // A generic HTTP 200 is not a delivery receipt.
    const reader=result.body?.getReader(); if(!reader)return {state:'retry',code:'invalid_receipt'};
    let text='',size=0; const decoder=new TextDecoder();
    while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>4096){await reader.cancel();return {state:'retry',code:'invalid_receipt'};}text+=decoder.decode(chunk.value,{stream:true});}
    text+=decoder.decode();const receipt=JSON.parse(text);
    return receipt?.received===true?{state:'sent',code:''}:{state:'retry',code:'invalid_receipt'};
  } catch {return {state:'retry',code:'portal_unavailable'};}
}
