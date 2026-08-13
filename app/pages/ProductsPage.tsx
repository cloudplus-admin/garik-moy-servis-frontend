"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {ArrowLeft,PackageSearch,RotateCcw} from "lucide-react";
import {Select} from "../components/Select";
import {API_URL} from "../lib/api";
import type {Company} from "../lib/types";
import {BatchesTab} from "./product-operations/BatchesTab";
import {MovementsTab} from "./product-operations/MovementsTab";
import {SalesTab} from "./product-operations/SalesTab";
import {StocksTab} from "./product-operations/StocksTab";
import {DataTable} from "./shared";
import {ProductTraceModal} from "./ProductTraceModal";

type Tab="stocks"|"warehouses"|"batches"|"movements"|"sales";
type Batch={batchNumber:string;product?:{sku:string;name:string};supplier:string;warehouse:string;arrivedAt:string;initialQuantity:number;availableQuantity:number};
type WarehouseStock={sku:string;productName:string;warehouseName:string;quantity:number;expectedIncoming:number;expectedOutgoing:number};
const tabs:[Tab,string][]=[["stocks","Остатки"],["warehouses","По складам"],["batches","Партии FIFO"],["movements","Движения"],["sales","Продажи"]];
const mapMovement=(r:any)=>[r.number,r.operation,r.source,r.destination,r.date,r.status];
const mapSale=(r:any)=>[r.number,r.date,r.customer,r.store||r.warehouse,r.warehouse,r.amount,r.paymentStatus];

export function ProductsPage({rows,company,salesFilter,movementFilter}:{rows:string[][];company:Company;salesFilter?:string;movementFilter?:string}){
 const [tab,setTab]=useState<Tab>(movementFilter?"movements":salesFilter?"sales":"stocks"),[query,setQuery]=useState(movementFilter??salesFilter??""),[sortIndex,setSortIndex]=useState<number|null>(null),[sortDirection,setSortDirection]=useState<"asc"|"desc">("asc"),[batches,setBatches]=useState<Batch[]>([]),[warehouseStocks,setWarehouseStocks]=useState<WarehouseStock[]>([]),[movements,setMovements]=useState<string[][]>([]),[sales,setSales]=useState<string[][]>([]),[selectedProduct,setSelectedProduct]=useState<{sku:string;name:string}|null>(null),[error,setError]=useState("");
 useEffect(()=>{
  if(tab==="stocks")return;
  const controller=new AbortController();
  fetch(`${API_URL}/api/${tab==="warehouses"?"warehouse-stocks":tab}?scope=${company}`,{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw new Error(`API ${response.status}`);return response.json()})
   .then(result=>{if(tab==="batches")setBatches(result);if(tab==="warehouses")setWarehouseStocks(result);if(tab==="movements")setMovements(result.map(mapMovement));if(tab==="sales")setSales(result.map(mapSale));setError("")})
   .catch(reason=>{if(reason.name!=="AbortError")setError(`Не удалось загрузить раздел «${tabs.find(([id])=>id===tab)?.[1]}»`) });
  return()=>controller.abort()
 },[company,tab]);
 const warehouseRows=useMemo(()=>warehouseStocks.map(x=>[x.sku,x.productName,x.warehouseName,String(x.quantity),String(x.expectedIncoming),String(x.expectedOutgoing)]),[warehouseStocks]);
 const source=tab==="stocks"?rows:tab==="warehouses"?warehouseRows:tab==="movements"?movements:sales;
 const sortRows=useCallback((items:string[][])=>sortIndex===null?items:[...items].sort((a,b)=>a[sortIndex].localeCompare(b[sortIndex],"ru",{numeric:true})*(sortDirection==="asc"?1:-1)),[sortIndex,sortDirection]);
 const shown=useMemo(()=>sortRows(source.filter(r=>r.join(" ").toLowerCase().includes(query.toLowerCase()))),[source,query,sortRows]);
 const batchRows=useMemo(()=>sortRows(batches.filter(b=>[b.batchNumber,b.product?.sku,b.product?.name,b.supplier,b.warehouse,b.arrivedAt].join(" ").toLowerCase().includes(query.toLowerCase())).map(b=>[b.batchNumber,b.product?.sku??"-",b.product?.name??"-",new Date(b.arrivedAt).toLocaleDateString("ru-RU"),b.supplier,b.warehouse,String(b.initialQuantity),String(b.availableQuantity)])),[batches,query,sortRows]);
 const visibleRows=tab==="batches"?batchRows:shown;
 const handleTab=(next:Tab)=>{setTab(next);setSortIndex(null);setSortDirection("asc")};
 const handleSort=(index:number)=>{if(sortIndex===index)setSortDirection(value=>value==="asc"?"desc":"asc");else{setSortIndex(index);setSortDirection("asc")}};
 const clearFilters=()=>{setQuery("");setSortIndex(null);setSortDirection("asc")};
 const tableProps={rows:visibleRows,sortIndex,sortDirection,onSort:handleSort};
 const openProduct=(row:string[])=>setSelectedProduct({sku:row[0],name:row[1]});
 return <><div className="operation-tabs" role="tablist" aria-label="Товары и операции">{tabs.map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} className={tab===id?"active":""} onClick={()=>handleTab(id)}>{label}</button>)}</div><div className="toolbar filters"><input className="filter" aria-label="Фильтр товаров и операций" placeholder="Товар, партия, клиент, магазин или дата" value={query} onChange={e=>setQuery(e.target.value)}/>{(query||sortIndex!==null)&&<button className="ghost" onClick={clearFilters}><RotateCcw/>Очистить фильтры и сортировку</button>}<span className="spacer"/><span className="count">{visibleRows.length} записей</span></div>{salesFilter&&<button className="back-filter" onClick={clearFilters}><ArrowLeft/>Ко всем продажам</button>}{error&&<p className="form-error" role="alert">{error}</p>}{visibleRows.length?tab==="stocks"?<StocksTab {...tableProps} onProductClick={openProduct}/>:tab==="warehouses"?<DataTable {...tableProps} onRowClick={openProduct} headers={["Артикул","Товар","Склад","В наличии","Ожидается","К отправке"]}/>:tab==="batches"?<BatchesTab {...tableProps}/>:tab==="movements"?<MovementsTab {...tableProps}/>:<SalesTab {...tableProps}/>:<section className="card data-state"><span className="state-icon"><PackageSearch/></span><h2>Ничего не найдено</h2><p>Очисти фильтр или выбери другой раздел.</p></section>}{selectedProduct&&<ProductTraceModal {...selectedProduct} company={company} onClose={()=>setSelectedProduct(null)}/>}</>
}
