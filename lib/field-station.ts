import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {z} from 'zod';
export const parks=['Liberty State Park','Hudson River Waterfront Walkway','Lincoln Park','Reservoir 3','Hackensack River waterfront'] as const;
const privateText=/(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{3}[-. ]\d{3}[-. ]\d{4}\b|\b(?:40|41)\.\d{3,}\s*[,; ]\s*-?7[34]\.\d{3,})/i;
const safeText=(min:number,max:number)=>z.string().trim().min(min).max(max).refine(v=>!privateText.test(v),'Remove personal contact details and exact coordinates.');
export const submissionSchema=z.object({id:z.string().uuid(),kind:z.enum(['sighting','field-note']),species:safeText(2,100),park:z.enum(parks),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v&&v<=new Date().toISOString().slice(0,10)&&v>='2000-01-01','Choose a valid date in the past or today.'),observation:safeText(20,1800),sourceCredit:safeText(3,350),sourceUrl:z.string().trim().max(600).refine(v=>{if(!v)return true;try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!u.search}catch{return false}},'Use an HTTPS source page without tracking parameters.')}).strict();
export function fieldDb(){if(!env.DB)throw new Error('Field station storage unavailable');return env.DB;}
export async function isReviewer(){const user=await getChatGPTUser();return !!user&&user.email.toLowerCase()==='rsingh0815@gmail.com';}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export const publicColumns='id, kind, species, park, date, observation, source_credit, source_url, origin, reviewed_at';
