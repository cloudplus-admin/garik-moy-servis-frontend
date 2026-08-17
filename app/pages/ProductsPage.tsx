"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {ArrowLeft,PackageSearch,RotateCcw} from "lucide-react";
import {Select} from "../components/Select";
import {API_URL} from "../lib/api";
import type {Company} from "../lib/types";
import {BatchesTab} from "./product-operations/BatchesTab";
import {MovementsTab} from "./product-operations/MovementsTab";
import {SalesTab} from "./product-operations/SalesTab";
import {StocksTab} from "./product-operations/StocksTab";
import {PriceListTab,type PriceListItem} from "./product-operations/PriceListTab";
import {DataTable} from "./shared";
import {ProductTraceModal} from "./ProductTraceModal";

type Tab="stocks"|"warehouses"|"batches"|"movements"|"sales"|"pricelist";
type Batch={batchNumber:string;product?:{sku:string;name:string};supplier:string;warehouse:string;arrivedAt:string;initialQuantity:number;availableQuantity:number};
type WarehouseStock={sku:string;productName:string;warehouseName:string;quantity:number;expectedIncoming:number;expectedOutgoing:number;purchasePrice:number;purchaseValue:number;retailPrice:number;retailValue:number};
type MovementFilterOptions={statuses:string[];operations:string[];suppliers:string[];warehouses:string[];products:string[];batches:string[]};
const emptyMovementOptions:MovementFilterOptions={statuses:[],operations:[],suppliers:[],warehouses:[],products:[],batches:[]};
const tabs:[Tab,string][]=[["stocks","Остатки"],["warehouses","По складам"],["batches","Партии FIFO"],["movements","Движения"],["sales","Продажи"],["pricelist","Прайс-лист"]];
const mapMovement=(r:any)=>[r.number,r.productName||"-",r.productSku||"-",r.operation,r.source,r.destination,String(r.quantity??0),r.date,r.status];
const mapSale=(r:any)=>[r.number,r.date,r.customer,r.store||r.warehouse,r.amount,r.paymentStatus];

export function ProductsPage({rows,company,salesFilter,movementFilter}:{rows:string[][];company:Company;salesFilter?:string;movementFilter?:string}){
 const router=useRouter(),params=useSearchParams();
 const requestedTab=params.get("tab") as Tab|null,initialSku=params.get("sku");
 const [tab,setTab]=useState<Tab>(tabs.some(([id])=>id===requestedTab)?requestedTab!:movementFilter?"movements":salesFilter?"sales":"stocks"),[query,setQuery]=useState(params.get("q")??movementFilter??salesFilter??""),[sortIndex,setSortIndex]=useState<number|null>(null),[sortDirection,setSortDirection]=useState<"asc"|"desc">("asc"),[batches,setBatches]=useState<Batch[]>([]),[warehouseStocks,setWarehouseStocks]=useState<WarehouseStock[]>([]),[movements,setMovements]=useState<string[][]>([]),[movementOptions,setMovementOptions]=useState<MovementFilterOptions>(emptyMovementOptions),[sales,setSales]=useState<string[][]>([]),[priceList,setPriceList]=useState<PriceListItem[]>([]),[selectedProduct,setSelectedProduct]=useState<{sku:string;name:string}|null>(initialSku&&requestedTab!=="movements"?{sku:initialSku,name:rows.find(row=>row[0]===initialSku)?.[1]??initialSku}:null),[error,setError]=useState("");
 const updateUrl=useCallback((values:Record<string,string|null|undefined>)=>{const next=new URLSearchParams(window.location.search);Object.entries(values).forEach(([key,value])=>{if(value)next.set(key,value);else next.delete(key)});router.replace(`/products${next.size?`?${next}`:""}`,{scroll:false})},[router]);
 useEffect(()=>{
  if(tab==="stocks")return;
  const controller=new AbortController();
  const movementQuery=tab==="movements"?["sku","warehouse","operation","batch","status","supplier"].map(key=>`&${key}=${encodeURIComponent(params.get(key)??"")}`).join(""):"";
  fetch(`${API_URL}/api/${tab==="warehouses"?"warehouse-stocks/valuation":tab==="movements"?"movements/search":tab}?scope=${company}${movementQuery}`,{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw new Error(`API ${response.status}`);return response.json()})
   .then(result=>{if(tab==="batches")setBatches(result);if(tab==="warehouses")setWarehouseStocks(result);if(tab==="movements")setMovements(result.map(mapMovement));if(tab==="sales")setSales(result.map(mapSale));if(tab==="pricelist")setPriceList(result);setError("")})
   .catch(reason=>{if(reason.name!=="AbortError")setError(`Не удалось загрузить раздел «${tabs.find(([id])=>id===tab)?.[1]}»`) });
  return()=>controller.abort()
 },[company,params,tab]);
 useEffect(()=>{if(tab!=="movements")return;const controller=new AbortController();fetch(`${API_URL}/api/movements/filter-options?scope=${company}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();return r.json()}).then(result=>setMovementOptions(result&&Array.isArray(result.statuses)?result:emptyMovementOptions)).catch(()=>{});return()=>controller.abort()},[company,tab]);
 const warehouseRows=useMemo(()=>warehouseStocks.map(x=>[x.sku,x.productName,x.warehouseName,String(x.quantity),String(x.expectedIncoming),String(x.expectedOutgoing),`${x.purchasePrice.toLocaleString("ru-RU")} сум`,`${x.purchaseValue.toLocaleString("ru-RU")} сум`,`${x.retailPrice.toLocaleString("ru-RU")} сум`,`${x.retailValue.toLocaleString("ru-RU")} сум`]),[warehouseStocks]);
 const source=useMemo(()=>tab==="stocks"?rows:tab==="warehouses"?warehouseRows:tab==="movements"?movements:tab==="sales"?sales:[],[movements,rows,sales,tab,warehouseRows]);
 const sortRows=useCallback((items:string[][])=>sortIndex===null?items:[...items].sort((a,b)=>a[sortIndex].localeCompare(b[sortIndex],"ru",{numeric:true})*(sortDirection==="asc"?1:-1)),[sortIndex,sortDirection]);
 const shown=useMemo(()=>{const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return sortRows(source.filter(r=>{const text=r.join(" ").toLowerCase();return terms.every(term=>text.includes(term))}))},[source,query,sortRows]);
 const batchRows=useMemo(()=>sortRows(batches.filter(b=>[b.batchNumber,b.product?.sku,b.product?.name,b.supplier,b.warehouse,b.arrivedAt].join(" ").toLowerCase().includes(query.toLowerCase())).map(b=>[b.batchNumber,b.product?.sku??"-",b.product?.name??"-",new Date(b.arrivedAt).toLocaleDateString("ru-RU"),b.supplier,b.warehouse,String(b.initialQuantity),String(b.availableQuantity)])),[batches,query,sortRows]);
 const visibleRows=tab==="batches"?batchRows:shown;
 const handleTab=(next:Tab)=>{setTab(next);setQuery("");setSortIndex(null);setSortDirection("asc");updateUrl({tab:next,q:null,sku:null,warehouse:null,operation:null,batch:null,status:null,supplier:null})};
 const handleSort=(index:number)=>{if(sortIndex===index)setSortDirection(value=>value==="asc"?"desc":"asc");else{setSortIndex(index);setSortDirection("asc")}};
 const clearFilters=()=>{setQuery("");setSortIndex(null);setSortDirection("asc");updateUrl({q:null,sku:null,warehouse:null,operation:null,batch:null,status:null,supplier:null})};
 const tableProps={rows:visibleRows,sortIndex,sortDirection,onSort:handleSort};
 const openProduct=(row:string[])=>{setSelectedProduct({sku:row[0],name:row[1]});updateUrl({sku:row[0]})};
 const closeProduct=()=>{setSelectedProduct(null);updateUrl({sku:null})};
 const select=(key:string,label:string,options:string[])=><Select multiple searchable={key==="sku"} ariaLabel={label} value={params.get(key)??""} onChange={value=>updateUrl({[key]:value||null})} options={[{value:"",label},...options.map(value=>{const product=rows.find(row=>row[0]===value);return {value,label:key==="sku"?(product?.[1]??value):value,secondary:key==="sku"?`SKU: ${value}`:undefined,searchText:key==="sku"?value:undefined}})]}/>;
 const openBatchHistory=(row:string[])=>{setTab("movements");setQuery("");updateUrl({tab:"movements",sku:row[1],batch:row[0],q:null})};
 const openSale=(row:string[])=>router.push(`/finance?sale=${encodeURIComponent(row[0])}`);
 return <><div className="operation-tabs" role="tablist" aria-label="Товары и операции">{tabs.map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} className={tab===id?"active":""} onClick={()=>handleTab(id)}>{label}</button>)}</div>{tab==="pricelist"?<PriceListTab items={priceList} company={company} onChange={setPriceList}/>:<><div className="toolbar filters"><input className="filter" aria-label="Фильтр товаров и операций" placeholder="Товар, партия, клиент, магазин или дата" value={query} onChange={e=>{setQuery(e.target.value);updateUrl({q:e.target.value})}}/>{tab==="movements"&&<>{select("status","Все статусы",movementOptions.statuses)}{select("operation","Все операции",movementOptions.operations)}{select("supplier","Все поставщики",movementOptions.suppliers)}{select("warehouse","Все склады",movementOptions.warehouses)}{select("sku","Все товары",movementOptions.products)}{select("batch","Все партии",movementOptions.batches)}</>}<button className="ghost" onClick={clearFilters}><RotateCcw/>Очистить фильтры и сортировку</button><span className="spacer"/><span className="count">{visibleRows.length} записей</span></div>{salesFilter&&<button className="back-filter" onClick={clearFilters}><ArrowLeft/>Ко всем продажам</button>}{error&&<p className="form-error" role="alert">{error}</p>}{visibleRows.length?tab==="stocks"?<StocksTab {...tableProps} onProductClick={openProduct}/>:tab==="warehouses"?<DataTable {...tableProps} hiddenColumns={[1]} onRowClick={openProduct} headers={["Артикул","Товар","Склад","В наличии","Ожидается","К отправке","Закупочная цена","Закупочная стоимость","Розничная цена","Розничная стоимость"]} columnClasses={["","product-column","","number-column","number-column","number-column","price-column","price-column","price-column","price-column"]}/>:tab==="batches"?<BatchesTab {...tableProps} onRowClick={openBatchHistory}/>:tab==="movements"?<MovementsTab {...tableProps}/>:<SalesTab {...tableProps} onRowClick={openSale}/>:<section className="card data-state"><span className="state-icon"><PackageSearch/></span><h2>Ничего не найдено</h2><p>Очисти фильтр или выбери другой раздел.</p></section>}</>}{selectedProduct&&<ProductTraceModal {...selectedProduct} company={company} onClose={closeProduct}/>}</>
}
