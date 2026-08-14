"use client";
import {useEffect,useState} from "react";
import {X} from "lucide-react";
import {API_URL} from "../lib/api";
import type {Company} from "../lib/types";

type Stock={id:number;warehouseName:string;sku:string;productName:string;quantity:number;expectedIncoming:number;expectedOutgoing:number};
type Batch={batchNumber:string;product?:{sku:string;name:string};supplier:string;warehouse:string;arrivedAt:string;initialQuantity:number;availableQuantity:number;expectedQuantity:number;expectedArrivalAt:string|null;plannedOutgoingQuantity:number;plannedShipmentAt:string|null;plannedDestination:string};

const date=(value:string|null)=>value?new Date(value).toLocaleDateString("ru-RU"):"-";

export function ProductTraceModal({sku,name,company,onClose}:{sku:string;name:string;company:Company;onClose:()=>void}){
 const [stocks,setStocks]=useState<Stock[]>([]),[batches,setBatches]=useState<Batch[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const incoming=batches.filter(x=>x.expectedQuantity>0);
 const outgoing=batches.filter(x=>x.plannedOutgoingQuantity>0);
 useEffect(()=>{const controller=new AbortController();Promise.all([fetch(`${API_URL}/api/warehouse-stocks?scope=${company}`,{signal:controller.signal}),fetch(`${API_URL}/api/batches?scope=${company}`,{signal:controller.signal})]).then(async responses=>{if(responses.some(r=>!r.ok))throw new Error();return Promise.all(responses.map(r=>r.json()))}).then(result=>{const [stockRows,batchRows]=result as [Stock[],Batch[]];setStocks(stockRows.filter(x=>x.sku===sku));setBatches(batchRows.filter(x=>x.product?.sku===sku));setError("")}).catch(e=>{if(e.name!=="AbortError")setError("Не удалось загрузить происхождение товара")}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[company,sku]);
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow="hidden";const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey)}},[onClose]);
 return <div className="modalback" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="modal warehouse-modal" role="dialog" aria-modal="true" aria-labelledby="trace-title"><div className="modalhead"><div><h2 id="trace-title">{name}</h2><small>Артикул {sku} - реальные остатки и маршруты партий</small></div><button className="close" aria-label="Закрыть сведения о товаре" onClick={onClose}><X/></button></div><div className="warehouse-stock-body">{loading?<p className="stock-state">Загружаем сведения...</p>:error?<p className="form-error" role="alert">{error}</p>:<><TraceSection title="Хранится на складах" empty="Остатков на складах нет">{stocks.length?<div className="table-scroll"><table className="table"><thead><tr><th>Склад</th><th>Доступно</th><th>Ожидается</th><th>К отправке</th></tr></thead><tbody>{stocks.map(x=><tr key={x.id}><td><strong>{x.warehouseName}</strong></td><td>{x.quantity} ед.</td><td>{x.expectedIncoming} ед.</td><td>{x.expectedOutgoing} ед.</td></tr>)}</tbody></table></div>:null}</TraceSection><TraceSection title="Запланированные отправки" empty="Запланированных отправок нет">{outgoing.length?<div className="table-scroll"><table className="table"><thead><tr><th>Партия</th><th>Откуда</th><th>Куда</th><th>Дата отправки</th><th>Количество</th><th>Доступно</th></tr></thead><tbody>{outgoing.map(x=><tr key={`outgoing-${x.batchNumber}`}><td><strong>{x.batchNumber}</strong></td><td>{x.warehouse}</td><td>{x.plannedDestination||"Получатель не указан"}</td><td>{date(x.plannedShipmentAt)}</td><td>{x.plannedOutgoingQuantity} ед.</td><td>{x.availableQuantity} ед.</td></tr>)}</tbody></table></div>:null}</TraceSection><TraceSection title="Ожидаемые поступления" empty="Ожидаемых поступлений нет">{incoming.length?<div className="table-scroll"><table className="table"><thead><tr><th>Партия</th><th>Откуда</th><th>Куда</th><th>Дата приема</th><th>Количество</th></tr></thead><tbody>{incoming.map(x=><tr key={`incoming-${x.batchNumber}`}><td><strong>{x.batchNumber}</strong></td><td>{x.supplier}</td><td>{x.warehouse}</td><td>{date(x.expectedArrivalAt)}</td><td>{x.expectedQuantity} ед.</td></tr>)}</tbody></table></div>:null}</TraceSection></>}</div></section></div>
}

function TraceSection({title,empty,children}:{title:string;empty:string;children:React.ReactNode}){
 return <section className="warehouse-stock-section"><h3>{title}</h3>{children??<p className="stock-state">{empty}</p>}</section>
}
