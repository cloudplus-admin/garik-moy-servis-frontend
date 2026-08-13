import type {BusinessData,Company,Page,PageData} from "./types";

export const API_URL=process.env.NEXT_PUBLIC_API_URL??"";
const cache=new Map<string,PageData>();

type Entity=Record<string,unknown>;
const text=(row:Entity,key:string)=>String(row[key]??"");
const rowMappers:Partial<Record<Page,(row:Entity)=>string[]>>={
  warehouses:r=>[text(r,"name"),text(r,"type"),text(r,"quantity"),text(r,"value"),text(r,"capacity")],
  products:r=>[text(r,"sku"),text(r,"name"),text(r,"brand"),text(r,"package"),text(r,"quantity"),text(r,"reserved"),text(r,"price"),text(r,"status")],
  movements:r=>[text(r,"number"),text(r,"operation"),text(r,"source"),text(r,"destination"),text(r,"date"),text(r,"status")],
  sales:r=>[text(r,"number"),text(r,"date"),text(r,"customer"),text(r,"store")||text(r,"warehouse"),text(r,"warehouse"),text(r,"amount"),text(r,"paymentStatus")],
  clients:r=>[text(r,"name"),text(r,"type"),text(r,"creditLimit"),text(r,"debt"),text(r,"dueDate"),text(r,"manager")],
  debts:r=>[text(r,"customer"),text(r,"store"),text(r,"direction"),text(r,"amount"),text(r,"dueDate"),text(r,"manager"),text(r,"saleId"),text(r,"status"),text(r,"kind")||"receivable",text(r,"comment"),text(r,"businessId"),text(r,"id")],
  finance:r=>[text(r,"name"),text(r,"owner"),text(r,"balance"),text(r,"updatedAt")],
};
const endpoint:Record<Page,string>={dashboard:"dashboard",warehouses:"warehouses",products:"products",movements:"movements",sales:"sales",clients:"clients",debts:"debts",finance:"finance",employees:"employees",reports:"reports"};

export async function loadPage(page:Page,company:Company,signal?:AbortSignal,refresh=false):Promise<PageData>{
  const key=`${page}:${company}`;
  if(!refresh&&cache.has(key))return cache.get(key)!;
  const url=page==="dashboard"?`${API_URL}/api/dashboard/${company}`:`${API_URL}/api/${endpoint[page]}${page==="reports"?"":`?scope=${company}`}`;
  const response=await fetch(url,{signal});
  if(!response.ok)throw new Error(`API ${response.status}`);
  const json=await response.json();
  let result:PageData;
  if(page==="dashboard")result=json as BusinessData;
  else if(page==="employees")result=(json as Entity[]).map(r=>`${text(r,"name")} · ${text(r,"role")}`);
  else if(page==="reports")result=json as string[];
  else result=(json as Entity[]).map(rowMappers[page]!);
  cache.set(key,result);return result;
}

export function invalidatePage(page:Page,company:Company){cache.delete(`${page}:${company}`)}
