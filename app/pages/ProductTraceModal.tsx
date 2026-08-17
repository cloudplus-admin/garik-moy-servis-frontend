"use client";
import {useEffect,useState} from "react";
import {X} from "lucide-react";
import {API_URL} from "../lib/api";
import type {Company} from "../lib/types";

type Stock={id:number;warehouseName:string;sku:string;productName:string;quantity:number;expectedIncoming:number;expectedOutgoing:number;projectedQuantity:number};
type Movement={id:number;number:string;batchNumber:string;source:string;destination:string;date:string;quantity:number;status:string};
type Trace={stocks:Stock[];incoming:Movement[];outgoing:Movement[];totals:{quantity:number;expectedIncoming:number;expectedOutgoing:number;projectedQuantity:number}};

const date=(value:string|null)=>{if(!value)return "-";const localized=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);if(localized)return value;const parsed=new Date(value);return Number.isNaN(parsed.getTime())?value:parsed.toLocaleDateString("ru-RU")};

export function ProductTraceModal({sku,name,company,onClose}:{sku:string;name:string;company:Company;onClose:()=>void}){
 const [trace,setTrace]=useState<Trace>({stocks:[],incoming:[],outgoing:[],totals:{quantity:0,expectedIncoming:0,expectedOutgoing:0,projectedQuantity:0}}),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const {stocks,incoming,outgoing,totals}=trace;
 useEffect(()=>{const controller=new AbortController();fetch(`${API_URL}/api/warehouse-stocks/product-trace?scope=${company}&sku=${encodeURIComponent(sku)}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();return response.json() as Promise<Trace>}).then(result=>{setTrace(result);setError("")}).catch(e=>{if(e.name!=="AbortError")setError("Не удалось загрузить актуальные данные товара")}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[company,sku]);
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow="hidden";const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey)}},[onClose]);
 return <div className="modalback" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="modal warehouse-modal" role="dialog" aria-modal="true" aria-labelledby="trace-title"><div className="modalhead"><div><h2 id="trace-title">{name}</h2><small>Артикул {sku} - актуальные остатки и маршруты из БД</small></div><button className="close" aria-label="Закрыть сведения о товаре" onClick={onClose}><X/></button></div><div className="warehouse-stock-body">{loading?<p className="stock-state">Загружаем сведения...</p>:error?<p className="form-error" role="alert">{error}</p>:<><TraceSection title="Хранится на складах" empty="Остатков на складах нет">{stocks.length?<div className="table-scroll"><table className="table"><thead><tr><th>Склад</th><th>Факт</th><th>Поступит</th><th>Отправится</th><th>Остаток</th></tr></thead><tbody>{stocks.map(x=><tr key={x.id}><td><strong>{x.warehouseName}</strong></td><td>{x.quantity} ед.</td><td>{x.expectedIncoming} ед.</td><td>{x.expectedOutgoing} ед.</td><td><strong>{x.projectedQuantity} ед.</strong></td></tr>)}</tbody><tfoot><tr className="warehouse-total-row"><th>Итого</th><td>{totals.quantity} ед.</td><td>{totals.expectedIncoming} ед.</td><td>{totals.expectedOutgoing} ед.</td><td><strong>{totals.projectedQuantity} ед.</strong></td></tr></tfoot></table></div>:null}</TraceSection><TraceSection title="Запланированные отправки" empty="Запланированных отправок нет">{outgoing.length?<MovementTable rows={outgoing}/>:null}</TraceSection><TraceSection title="Ожидаемые поступления" empty="Ожидаемых поступлений нет">{incoming.length?<MovementTable rows={incoming}/>:null}</TraceSection></>}</div></section></div>
}

function MovementTable({rows}:{rows:Movement[]}){return <div className="table-scroll"><table className="table"><thead><tr><th>Документ</th><th>Партия</th><th>Откуда</th><th>Куда</th><th>Дата</th><th>Количество</th><th>Статус</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><strong>{x.number}</strong></td><td>{x.batchNumber}</td><td>{x.source}</td><td>{x.destination}</td><td>{date(x.date)}</td><td>{x.quantity} ед.</td><td>{x.status}</td></tr>)}</tbody></table></div>}

function TraceSection({title,empty,children}:{title:string;empty:string;children:React.ReactNode}){
 return <section className="warehouse-stock-section"><h3>{title}</h3>{children??<p className="stock-state">{empty}</p>}</section>
}
