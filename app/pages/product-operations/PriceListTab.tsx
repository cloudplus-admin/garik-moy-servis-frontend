"use client";
import {useMemo,useState} from "react";
import {Plus,Save,Trash2,X} from "lucide-react";
import {Select} from "../../components/Select";
import {API_URL} from "../../lib/api";
import type {Company} from "../../lib/types";

export type PriceListItem={businessCode:"import"|"retail";sku:string;name:string;purchasePrice:number;retailPrice:number};
const money=(value:number)=>`${value.toLocaleString("ru-RU")} сум`;
const blank=(company:Company):PriceListItem=>({businessCode:company==="retail"?"retail":"import",sku:"",name:"",purchasePrice:0,retailPrice:0});

export function PriceListTab({items,company,onChange}:{items:PriceListItem[];company:Company;onChange:(items:PriceListItem[])=>void}){
 const [editing,setEditing]=useState<PriceListItem|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[deleteKey,setDeleteKey]=useState("");
 const sorted=useMemo(()=>[...items].sort((a,b)=>a.name.localeCompare(b.name,"ru")),[items]);
 const save=async()=>{
  if(!editing)return;setBusy(true);setError("");
  try{const response=await fetch(`${API_URL}/api/pricelist`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing)});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.message??`API ${response.status}`);onChange([...items.filter(x=>!(x.businessCode===body.businessCode&&x.sku===body.sku)),body]);setEditing(null)}catch(reason){setError(reason instanceof Error?reason.message:"Не удалось сохранить цену")}finally{setBusy(false)}
 };
 const remove=async(item:PriceListItem)=>{
  const key=`${item.businessCode}:${item.sku}`;if(deleteKey!==key){setDeleteKey(key);return}setBusy(true);setError("");
  try{const response=await fetch(`${API_URL}/api/pricelist/${item.businessCode}/${encodeURIComponent(item.sku)}`,{method:"DELETE"});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.message??`API ${response.status}`)}onChange(items.filter(x=>!(x.businessCode===item.businessCode&&x.sku===item.sku)));setDeleteKey("")}catch(reason){setError(reason instanceof Error?reason.message:"Не удалось удалить цену")}finally{setBusy(false)}
 };
 return <section className="pricelist-workspace">
  <div className="pricelist-head"><div><h2>Прайс-лист</h2><p>Единый источник закупочных и розничных цен для всех расчетов.</p></div><button className="primary" onClick={()=>setEditing(blank(company))}><Plus/>Добавить товар</button></div>
  {editing&&<div className="card pricelist-editor"><div className="pricelist-editor-title"><strong>{items.some(x=>x.businessCode===editing.businessCode&&x.sku===editing.sku)?"Изменение цены":"Новый товар"}</strong><button className="close" aria-label="Закрыть форму" onClick={()=>setEditing(null)}><X/></button></div><div className="formgrid">
   <div className="field"><label>Компания</label><Select value={editing.businessCode} options={[{value:"import",label:"GARIK IMPORT"},{value:"retail",label:"GARIK RETAIL"}]} onChange={value=>setEditing({...editing,businessCode:value as "import"|"retail"})} ariaLabel="Компания прайс-листа"/></div>
   <div className="field"><label>Артикул</label><input value={editing.sku} onChange={e=>setEditing({...editing,sku:e.target.value})} disabled={items.some(x=>x.businessCode===editing.businessCode&&x.sku===editing.sku)}/></div>
   <div className="field full"><label>Название товара</label><input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></div>
   <div className="field"><label>Закупочная цена, сум</label><input type="number" min="1" value={editing.purchasePrice||""} onChange={e=>setEditing({...editing,purchasePrice:Number(e.target.value)})}/></div>
   <div className="field"><label>Розничная цена, сум</label><input type="number" min="1" value={editing.retailPrice||""} onChange={e=>setEditing({...editing,retailPrice:Number(e.target.value)})}/></div>
  </div>{error&&<p className="form-error" role="alert">{error}</p>}<div className="pricelist-editor-actions"><button className="ghost" onClick={()=>setEditing(null)}>Отмена</button><button className="primary" disabled={busy} onClick={save}><Save/>{busy?"Сохранение...":"Сохранить"}</button></div></div>}
  {error&&!editing&&<p className="form-error" role="alert">{error}</p>}
  <div className="card tablecard"><div className="table-scroll"><table className="table"><thead><tr><th>Поставщик</th><th>Артикул</th><th>Товар</th><th className="price-column">Закупочная цена</th><th className="price-column">Розничная цена</th><th>Действия</th></tr></thead><tbody>{sorted.map(item=>{const key=`${item.businessCode}:${item.sku}`;return <tr key={key}><td>{item.businessCode==="import"?"GARIK IMPORT":"GARIK RETAIL"}</td><td><strong>{item.sku}</strong></td><td>{item.name}</td><td className="price-column">{money(item.purchasePrice)}</td><td className="price-column">{money(item.retailPrice)}</td><td><div className="row-actions"><button className="ghost" onClick={()=>{setEditing({...item});setDeleteKey("")}}>Изменить</button><button className={deleteKey===key?"delete-confirm":"icon-action"} aria-label={deleteKey===key?`Подтвердить удаление ${item.name}`:`Удалить ${item.name}`} disabled={busy} onClick={()=>remove(item)}><Trash2/>{deleteKey===key&&<span>Подтвердить</span>}</button></div></td></tr>})}</tbody></table></div></div>
 </section>
}
