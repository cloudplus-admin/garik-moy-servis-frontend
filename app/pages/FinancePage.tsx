"use client";
import {useEffect,useState} from "react";
import {AlertTriangle,CircleDollarSign,ShoppingCart,Users,WalletCards} from "lucide-react";
import {Select} from "../components/Select";
import {API_URL} from "../lib/api";
import type {Company} from "../lib/types";
import {DataTable} from "./shared";
type Overview={available:number;payroll:number;supplierDebt:number;clientDebt:number;forecast:number;sales:Array<{number:string;date:string;customer:string;store:string;warehouse:string;amount:string;paymentStatus:string}>;products:Array<{sku:string;name:string;units:number;revenue:number;cost:number;grossProfit:number;margin:number}>};
const money=(value:number)=>`${new Intl.NumberFormat("ru-RU").format(value)} сум`;
export function FinancePage({rows,company}:{rows:string[][];company:Company}){
 const [period,setPeriod]=useState("month"),[overview,setOverview]=useState<Overview|null>(null),[error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();fetch(`${API_URL}/api/finance/overview?scope=${company}&period=${period}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();setOverview(await response.json());setError("")}).catch(reason=>{if(reason?.name!=="AbortError")setError("Не удалось загрузить кассовую сводку")});return()=>controller.abort()},[company,period]);
 if(error)return <div className="card panel"><p>{error}</p></div>;
 if(!overview)return <div className="card panel"><p>Загрузка кассовой сводки...</p></div>;
 const saleRows=overview.sales.map(x=>[x.number,x.date,x.customer,x.store||x.warehouse,x.amount,x.paymentStatus]);
 const productRows=overview.products.map(x=>[x.sku,x.name,String(x.units),money(x.revenue),money(x.cost),money(x.grossProfit),`${x.margin}%`]);
 return <><div className="toolbar"><Select ariaLabel="Период аналитики" value={period} onChange={setPeriod} options={[{value:"week",label:"Неделя"},{value:"month",label:"Месяц"},{value:"year",label:"Год"}]}/><span className="spacer"/><span className="count">Данные рассчитаны из PostgreSQL</span></div>
 <div className="kpis"><Kpi icon={CircleDollarSign} label="Доступно сейчас" value={money(overview.available)}/><Kpi icon={Users} label="Выплаты сотрудникам" value={money(overview.payroll)}/><Kpi icon={AlertTriangle} label="Долги поставщикам" value={money(overview.supplierDebt)}/><Kpi icon={WalletCards} label="Клиенты должны" value={money(overview.clientDebt)}/><Kpi icon={ShoppingCart} label="После обязательств" value={money(overview.forecast)}/></div>
 <div className="grid2"><section className="card panel"><div className="panel-title"><h3>Кассы и счета</h3><span>{rows.length} счета</span></div><div className="alerts">{rows.map(c=><div className="alert" key={c[0]+c[1]}><span className="alert-icon"><CircleDollarSign size={15}/></span><div><strong>{c[0]}</strong><small>{c[1]} · {c[3]}</small></div><b>{c[2]}</b></div>)}</div></section><section className="card panel"><div className="panel-title"><h3>Прогнозный остаток</h3></div><strong className="cash-forecast">{money(overview.forecast)}</strong><p>Доступно - зарплаты - долги поставщикам + ожидаемые оплаты клиентов.</p></section></div>
 <section className="finance-section"><div className="panel-title"><h3>Продажи</h3><span>{saleRows.length} операций</span></div><DataTable headers={["Документ","Дата","Клиент","Магазин","Сумма","Оплата"]} rows={saleRows}/></section>
 <section className="finance-section"><div className="panel-title"><h3>Товарная аналитика</h3><span>По выручке и валовой прибыли</span></div><DataTable headers={["Артикул","Товар","Продано","Выручка","Себестоимость","Валовая прибыль","Маржа"]} rows={productRows}/></section></>;
}
function Kpi({icon:Icon,label,value}:{icon:React.ComponentType<{size?:number}>;label:string;value:string}){return <div className="card kpi"><span className="kpi-icon"><Icon/></span><div><small>{label}</small><strong>{value}</strong></div></div>}
