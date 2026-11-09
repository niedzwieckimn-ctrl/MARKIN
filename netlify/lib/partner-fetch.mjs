import { request } from 'node:https';
import { rootCertificates, checkServerIdentity } from 'node:tls';
import { X509Certificate } from 'node:crypto';
import { Readable } from 'node:stream';
import { ISSUER_PEM, ISSUER_SHA256 } from './forbet-issuer.mjs';

// An incomplete chain presented by precisely this supplier can be completed ONLY
// back to a root that is ALREADY trusted by Node. No global TLS configuration.
export function verifiedChain(roots=rootCertificates, now=Date.now()) {
  const intermediate=new X509Certificate(ISSUER_PEM);
  const inDate=c=>now>=Date.parse(c.validFrom)&&now<=Date.parse(c.validTo);
  if(!intermediate.ca||!inDate(intermediate)||intermediate.fingerprint256!==ISSUER_SHA256)throw Error('UNVERIFIED_ISSUING_CA');
  for(const pem of roots){const root=new X509Certificate(pem);
    if(root.ca&&inDate(root)&&root.subject===intermediate.issuer&&intermediate.checkIssued(root)&&intermediate.verify(root.publicKey))return [pem,ISSUER_PEM];
  }
  throw Error('UNVERIFIED_ISSUING_CA');
}
export const mayCompleteChain=(u,code)=>u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['forbet.pl','www.forbet.pl'].includes(u.hostname)&&['UNABLE_TO_VERIFY_LEAF_SIGNATURE','UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(code);

export async function partnerFetch(url,options={}){
  try{return await fetch(url,options);}catch(error){
    const target=new URL(url);
    if(!mayCompleteChain(target,error.cause?.code)||options.signal?.aborted)throw error;
    const chain=verifiedChain();
    return new Promise((resolve,reject)=>{
      const req=request(target,{method:'GET',agent:false,ca:chain,allowPartialTrustChain:false,
        rejectUnauthorized:true,checkServerIdentity,servername:target.hostname,minVersion:'TLSv1.2',signal:options.signal,
        headers:{...Object.fromEntries(new Headers(options.headers||{})),'accept-encoding':'identity'}},res=>{
        try{
          if(!res.socket.authorized)throw Error('UNAUTHORIZED_TLS_CONNECTION');
          const headers=new Headers();for(const k of ['content-type','content-length','location'])if(typeof res.headers[k]==='string')headers.set(k,res.headers[k]);
          const status=res.statusCode||500;
          if(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity')throw Error('UNEXPECTED_CONTENT_ENCODING');
          if([204,205,304].includes(status)){res.resume();resolve(new Response(null,{status,headers}));}
          else resolve(new Response(Readable.toWeb(res),{status,headers}));
        }catch(e){res.destroy();reject(e);}
      });req.on('error',reject);req.end();
    });
  }
}
