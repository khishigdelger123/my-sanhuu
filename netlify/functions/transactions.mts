import type { Config, Context } from '@netlify/functions';
import { and, eq, desc } from 'drizzle-orm';
import { getDb } from '../../db/index';
import { transactions } from '../../db/schema';
export default async (req: Request, context: Context) => {
 const headers = {'Cache-Control':'no-store'};
 const publicRow = ({owner: _owner, ...row}: typeof transactions.$inferSelect) => row;
 const reply = (data: unknown, status=200) => Response.json(data,{status,headers});
 if (!['GET','POST','PUT','DELETE'].includes(req.method)) return reply({error:'Зөвшөөрөгдөөгүй хүсэлт'},405);
 if (req.method !== 'GET' && req.headers.get('origin') !== new URL(req.url).origin) return reply({error:'Хүсэлтийг зөвшөөрөхгүй'},403);
 let owner = context.cookies.get('sanhuu_ledger');
 if (!owner || !/^[a-f0-9-]{36}$/.test(owner)) {
  owner = crypto.randomUUID();
  context.cookies.set({name:'sanhuu_ledger',value:owner,httpOnly:true,secure:new URL(req.url).protocol==='https:',sameSite:'Lax',path:'/',maxAge:31536000});
 }
 try {
  const db = getDb();
  if (req.method === 'GET') return reply((await db.select().from(transactions).where(eq(transactions.owner,owner)).orderBy(desc(transactions.date),desc(transactions.id))).map(publicRow));
  let body; try { body = await req.json(); } catch { return reply({error:'Мэдээллийн формат буруу'},400); }
  if (req.method === 'DELETE') {
   if(!Number.isInteger(body.id)) return reply({error:'Бүртгэлийн дугаар буруу'},400);
   const rows = await db.delete(transactions).where(and(eq(transactions.owner,owner),eq(transactions.id,body.id))).returning();
   return rows.length ? reply({ok:true}) : reply({error:'Бүртгэл олдсонгүй'},404);
  }
  const {title,amount,type,category,account,date,note=''} = body;
  if (typeof title!=='string'||!title.trim()||title.length>120||!Number.isFinite(Number(amount))||Number(amount)<=0||Number(amount)>1e12||!['income','expense'].includes(type)||!['Хоол, хүнс','Тээвэр','Худалдан авалт','Орон сууц','Эрүүл мэнд','Чөлөөт цаг','Цалин','Бусад'].includes(category)||!['Хаан банк','Голомт банк','Бэлэн мөнгө'].includes(account)||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||typeof note!=='string'||note.length>1000) return reply({error:'Талбаруудыг зөв бөглөнө үү'},400);
  const values = {title:title.trim(),amount:Number(amount).toFixed(2),type,category,account,date,note};
  if(req.method==='PUT') {
   if(!Number.isInteger(body.id)) return reply({error:'Бүртгэлийн дугаар буруу'},400);
   const rows=await db.update(transactions).set(values).where(and(eq(transactions.owner,owner),eq(transactions.id,body.id))).returning();
   return rows.length?reply(publicRow(rows[0])):reply({error:'Бүртгэл олдсонгүй'},404);
  }
  return reply(publicRow((await db.insert(transactions).values({...values,owner}).returning())[0]),201);
 } catch { return reply({error:'Өгөгдөлтэй холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.'},503); }
};
export const config: Config = {path:'/api/transactions'};
