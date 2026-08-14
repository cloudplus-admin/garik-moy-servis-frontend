"use client";

import { useEffect, useMemo, useState } from "react";
import {usePathname,useRouter} from "next/navigation";
import {
  AlertTriangle, ArrowDownToLine, ArrowRightLeft, BarChart3, Bell, Boxes,
  Check, CircleDollarSign, Download, FileBarChart,
  Eye, FileSpreadsheet, LayoutDashboard, Menu, Moon, Package, Plus, ShieldCheck, ShoppingCart, Sun,
  Store, UserRound, Users, WalletCards, Warehouse, X
} from "lucide-react";
import { Select } from "./components/Select";
import { PageState } from "./components/PageState";
import { API_URL, invalidatePage, loadPage } from "./lib/api";
import {exportWordReport} from "./lib/export-word-report";
import type {BusinessData,Company,Page,PageData,SalesTrendPoint} from "./lib/types";
import {DashboardPage} from "./pages/DashboardPage";
import {WarehousesPage} from "./pages/WarehousesPage";
import {ProductsPage} from "./pages/ProductsPage";
import {ClientsPage} from "./pages/ClientsPage";
import {DebtsPage} from "./pages/DebtsPage";
import {FinancePage} from "./pages/FinancePage";
import {EmployeesPage} from "./pages/EmployeesPage";
import {ReportsPage} from "./pages/ReportsPage";
import {PaymentModal} from "./components/PaymentModal";

type Modal = "sale"|"payment"|"transfer"|null;
type Role = "Руководитель"|"Бухгалтер"|"Продавец"|"Кладовщик";
type IconComponent = React.ComponentType<{size?:number}>;

const nav: {id:Page; label:string; icon:IconComponent}[] = [
  {id:"dashboard",label:"Обзор бизнеса",icon:LayoutDashboard},{id:"warehouses",label:"Склады",icon:Warehouse},
  {id:"products",label:"Товары и операции",icon:Package},{id:"clients",label:"Контрагенты",icon:Users},
  {id:"debts",label:"Кредит и дебит",icon:WalletCards},{id:"finance",label:"Касса",icon:BarChart3},
  {id:"employees",label:"Сотрудники",icon:UserRound},{id:"reports",label:"Отчеты",icon:FileBarChart},
];
const titles:Record<Page,[string,string]> = {
  dashboard:["Обзор бизнеса","Импорт, розница, деньги и склады в одном окне"],
  warehouses:["Складская сеть","8 точек хранения и полный контроль перемещений"],
  products:["Товары и операции","Остатки, партии FIFO, движения и продажи в одном рабочем разделе"],
  movements:["Движение товара","Поступления, перемещения, списания и инвентаризации"],
  sales:["Продажи","Оплаченные, частично оплаченные и долговые продажи"],
  clients:["Контрагенты","Покупатели, партнеры, история операций и задолженности"],
  debts:["Кредит и дебит","Кредиторская и дебиторская задолженность"],
  finance:["Касса","Доступные средства, обязательства, продажи и прибыль"],
  employees:["Сотрудники и права","Команда выбранного бизнеса, роли и доступы"],
  reports:["Отчеты","Готовые управленческие и складские отчеты"],
};
const companyInfo = {
  all:{name:"Все компании",short:"Группа компаний",code:"GROUP",color:"#174b3a"},
  import:{name:"GARIK IMPORT",short:"Импорт из Германии",code:"IMP",color:"#174b3a"},
  retail:{name:"GARIK RETAIL",short:"Розничная торговля",code:"RTL",color:"#315c9a"},
};
const data:Record<"import"|"retail",BusinessData> = {
  import:{
    hero:["Оптовые поставки из Германии","2,42 млрд сум","638 млн сум","1 376 ед.","1,96 млрд сум"],
    kpi:["2,42 млрд сум","142,4 млн сум","1,96 млрд сум","487,2 млн сум"],
    products:[
      ["IMP-RAV-530","Ravenol VMP 5W-30","Ravenol","4 л","412","40","598 000","В наличии"],
      ["IMP-LM-540","Liqui Moly 5W-40","Liqui Moly","4 л","284","32","682 000","В наличии"],
      ["IMP-ZF-ATF","ZF Lifeguard Fluid 8","ZF","1 л","328","45","267 000","В наличии"],
      ["IMP-FCH-1040","Fuchs Titan 10W-40","Fuchs","20 л","19","10","1 980 000","Мало"],
    ],
    clients:[
      ["OOO TASHKENT AUTO PARTS","Дистрибьютор","124 800 000","18 400 000","15.08.2026","Азиз Каримов"],
      ["BEST MOTOR OIL","Оптовый клиент","95 000 000","16 360 000","25.07.2026","Азиз Каримов"],
      ["SAMARKAND LUBRICANTS","Региональный дилер","150 000 000","42 600 000","18.08.2026","Нодир Саидов"],
    ],
    movements:[
      ["IMP-ПР-00842","Поступление","Ravenol GmbH","Склад импорта","Сегодня, 09:24","Проведен"],
      ["IMP-ПР-00841","Поступление","Liqui Moly GmbH","Склад импорта","29.07.2026","Проведен"],
      ["IMP-ОТ-00318","Отгрузка","Склад импорта","TASHKENT AUTO PARTS","Сегодня, 08:10","В пути"],
    ],
    warehouses:[["Центральный склад импорта","Основной оптовый склад","1 248","1,86 млрд","98%"],["Таможенный склад","Ожидает оформления","86","74 млн","54%"],["Резерв импорта","Страховой запас","42","29 млн","36%"]],
    sales:[["IMP-01431","Сегодня, 10:16","OOO TASHKENT AUTO PARTS","Центральный склад","38 600 000","В долг"],["IMP-01428","Вчера, 17:05","SAMARKAND LUBRICANTS","Центральный склад","62 800 000","Оплачено"],["IMP-01422","29.07.2026","BEST MOTOR OIL","Центральный склад","46 100 000","Частично"]],
    debts:[["OOO TASHKENT AUTO PARTS","Импорт","18 400 000","15.08.2026","Азиз Каримов","Ожидается"],["BEST MOTOR OIL","Импорт","16 360 000","25.07.2026","Азиз Каримов","Просрочен"],["SAMARKAND LUBRICANTS","Импорт","42 600 000","18.08.2026","Нодир Саидов","Ожидается"]],
    cash:[["Расчетный счет UZS","GARIK IMPORT","624 800 000","Сегодня, 09:40"],["Расчетный счет EUR","GARIK IMPORT","28 600 EUR","Вчера, 17:25"],["Оптовая касса","GARIK IMPORT","92 400 000","Сегодня, 10:12"]],
    staff:["Азиз Каримов · Руководитель продаж","Нодир Саидов · Менеджер опта","Рустам Алимов · Кладовщик"],
  },
  retail:{
    hero:["Розничный магазин и сеть складов","846 млн сум","151 млн сум","3 012 ед.","2,36 млрд сум"],
    kpi:["846 млн сум","42,2 млн сум","2,36 млрд сум","151,2 млн сум"],
    products:[
      ["RTL-RAV-530","Ravenol VMP 5W-30","Ravenol","4 л","156","24","620 000","В наличии"],
      ["RTL-LM-540","Liqui Moly 5W-40","Liqui Moly","4 л","84","12","710 000","В наличии"],
      ["RTL-RAV-020","Ravenol ECS 0W-20","Ravenol","4 л","31","8","680 000","Мало"],
      ["RTL-MEG-530","Meguin 5W-30 Professional","Meguin","20 л","42","6","2 180 000","В наличии"],
    ],
    clients:[
      ["SERGELI MOTORS","Мелкий опт","45 000 000","8 700 000","02.08.2026","Бекзод Рахимов"],
      ["AVTO OIL MARKET","Постоянный клиент","80 000 000","0","-","Дилшод Юсупов"],
      ["Акмал Турсунов","Розница","8 000 000","2 140 000","23.07.2026","Малика Хасанова"],
    ],
    movements:[
      ["RTL-ПМ-00318","Перемещение","Удаленный склад","Магазин Сергели","Сегодня, 08:10","В пути"],
      ["RTL-ИНВ-00051","Инвентаризация","Малый склад 3","-","30.07.2026","На проверке"],
      ["RTL-СП-00107","Списание","Магазин Сергели","Повреждение тары","29.07.2026","Проведен"],
    ],
    warehouses:[["Магазин Сергели","Точка продажи","746","684 млн","76%"],["Малый склад 1","Рядом с магазином","312","218 млн","68%"],["Малый склад 2","Рядом с магазином","284","196 млн","63%"],["Малый склад 3","Рядом с магазином","198","143 млн","45%"],["Малые склады 4-7","Объединенная группа","591","407 млн","72%"],["Удаленный склад","200 м²","883","712 млн","81%"]],
    sales:[["RTL-01430","Сегодня, 09:52","Акмал Турсунов","Магазин Сергели","1 420 000","Оплачено"],["RTL-01429","Вчера, 18:42","SERGELI MOTORS","Магазин Сергели","12 700 000","Частично"],["RTL-01425","30.07.2026","AVTO OIL MARKET","Магазин Сергели","8 640 000","Оплачено"]],
    debts:[["SERGELI MOTORS","Розница","8 700 000","02.08.2026","Бекзод Рахимов","Скоро срок"],["Акмал Турсунов","Розница","2 140 000","23.07.2026","Малика Хасанова","Просрочен"]],
    cash:[["Касса магазина","GARIK RETAIL","186 400 000","Сегодня, 10:12"],["Терминал Uzcard/Humo","GARIK RETAIL","74 200 000","Сегодня, 10:05"],["Расчетный счет UZS","GARIK RETAIL","192 600 000","Вчера, 18:00"]],
    staff:["Бекзод Рахимов · Старший продавец","Малика Хасанова · Продавец","Сардор Азимов · Кладовщик"],
  }
};
const observers:{name:string;role:Role;company:Company;title:string}[]=[
  {name:"Алишер Юсупов",role:"Руководитель",company:"all",title:"Директор группы"},
  {name:"Дилноза Ибрагимова",role:"Бухгалтер",company:"all",title:"Главный бухгалтер"},
  {name:"Азиз Каримов",role:"Продавец",company:"import",title:"Менеджер оптовых продаж"},
  {name:"Рустам Алимов",role:"Кладовщик",company:"import",title:"Кладовщик импорта"},
  {name:"Малика Хасанова",role:"Продавец",company:"retail",title:"Продавец магазина"},
  {name:"Сардор Азимов",role:"Кладовщик",company:"retail",title:"Кладовщик розницы"},
];
const combinedData:BusinessData={hero:["Объединенная аналитика группы","3,27 млрд сум","789 млн сум","4 388 ед.","4,32 млрд сум"],kpi:["3,27 млрд сум","184,6 млн сум","4,32 млрд сум","638,4 млн сум"],products:[...data.import.products,...data.retail.products],clients:[...data.import.clients,...data.retail.clients],movements:[...data.import.movements,...data.retail.movements],warehouses:[...data.import.warehouses,...data.retail.warehouses],sales:[...data.import.sales,...data.retail.sales],debts:[...data.import.debts,...data.retail.debts],cash:[...data.import.cash,...data.retail.cash],staff:[...data.import.staff,...data.retail.staff]};
const savedTheme=(owner:string):"light"|"dark"=>typeof window!=="undefined"&&window.localStorage.getItem(`garik-theme:${owner}`)==="dark"?"dark":"light";
const savedCompany=(owner:string):Company=>{if(typeof window==="undefined")return "all";const value=window.localStorage.getItem(`garik-company:${owner}`);return value==="import"||value==="retail"?value:"all"};

export default function Home(){
  const pathname=usePathname(),router=useRouter();
  const routePage=((pathname.split("/")[1]||"dashboard") as Page);
  const page:Page=titles[routePage]?routePage:"dashboard";
  const [modal,setModal]=useState<Modal>(null);
  const [role,setRole]=useState<Role>("Руководитель"),[company,setCompany]=useState<Company>("all");
  const [observer,setObserver]=useState(""),[observerOpen,setObserverOpen]=useState(false),[dataExchangeOpen,setDataExchangeOpen]=useState(false),[debtOpen,setDebtOpen]=useState(false);
  const [toast,setToast]=useState(""),[menu,setMenu]=useState(false),[theme,setTheme]=useState<"light"|"dark">("light");
  const [salesFilter,setSalesFilter]=useState("");
  const [movementFilter,setMovementFilter]=useState("");
  const [selected,setSelected]=useState<BusinessData>(combinedData),[pageData,setPageData]=useState<PageData>(combinedData),[pageDataKey,setPageDataKey]=useState(""),[loading,setLoading]=useState(true),[apiError,setApiError]=useState(""),[reloadNonce,setReloadNonce]=useState(0);
  const themeOwner=observer||"Алишер Юсупов";
  const currentUser=observer?observers.find(x=>x.name===observer):null;
  useEffect(()=>{const timer=window.setTimeout(()=>setTheme(savedTheme(themeOwner)),0);return()=>window.clearTimeout(timer)},[themeOwner]);
  useEffect(()=>{if(currentUser&&currentUser.company!=="all")return;const timer=window.setTimeout(()=>setCompany(savedCompany(themeOwner)),0);return()=>window.clearTimeout(timer)},[currentUser,themeOwner]);
  useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
  function toggleTheme(){const next=theme==="light"?"dark":"light";setTheme(next);document.documentElement.dataset.theme=next;window.localStorage.setItem(`garik-theme:${themeOwner}`,next)}
  useEffect(()=>{
    const controller=new AbortController();
    async function load(){
      await Promise.resolve();setLoading(true);setApiError("");
      try{const result=await loadPage(page,company,controller.signal);if(controller.signal.aborted)return;setPageData(result);setPageDataKey(`${page}:${company}`);if(page==="dashboard")setSelected(result as BusinessData)}
      catch(error){if(error instanceof Error&&error.name!=="AbortError")setApiError("Не удалось получить данные с сервера")}
      finally{if(!controller.signal.aborted)setLoading(false)}
    }
    void load();
    return()=>controller.abort();
  },[company,page,reloadNonce]);
  const allowed = role==="Продавец" ? nav.filter(x=>!["finance","reports","movements","employees"].includes(x.id)) : role==="Кладовщик" ? nav.filter(x=>["dashboard","warehouses","products","movements"].includes(x.id)) : nav;
  const rows=Array.isArray(pageData)?pageData as string[]|string[][]:[];
  const pageDataReady=pageDataKey===`${page}:${company}`;
  const filteredProducts=useMemo(()=>page==="products"&&Array.isArray(pageData)?pageData as string[][]:[],[page,pageData]);
  function done(text:string){setModal(null);invalidatePage(page,company);setReloadNonce(value=>value+1);setToast(text);setTimeout(()=>setToast(""),2600)}
  function navigate(id:Page){router.push(id==="dashboard"?"/":`/${id}`)}
  function openPage(id:Page){setSalesFilter("");setMovementFilter("");navigate(id==="sales"||id==="movements"?"products":id);setMenu(false)}
  function openSales(filter=""){setSalesFilter(filter);navigate("finance");setMenu(false)}
  function openMovements(filter=""){setMovementFilter(filter);setSalesFilter("");router.push(`/products?tab=movements${filter?`&${filter}`:""}`);setMenu(false)}
  function impersonate(name:string){
    const person=observers.find(x=>x.name===name);setObserver(name);setTheme(savedTheme(name||"Алишер Юсупов"));
    if(person){setRole(person.role);setCompany(person.company);navigate("dashboard");setToast(`Режим наблюдателя: ${person.name}`)}
    else {setRole("Руководитель");setCompany("all");setToast("Режим наблюдателя завершен")}
    setObserverOpen(false);setTimeout(()=>setToast(""),2600)
  }
  return <div className="app">
    <aside className={`sidebar ${menu?"open":""}`}>
      <div className="brand"><div className="brandmark">GM</div><div><strong>GARIK MOY SERVIS</strong><small>ERP и складской учет</small></div></div>
      <nav className="nav">{allowed.map(item=><button key={item.id} onClick={()=>openPage(item.id)} className={page===item.id?"active":""}><item.icon/>{item.label}</button>)}</nav>
      <div className="sidebar-note"><p><span className="live"/>Система работает</p><strong>Все данные актуальны</strong></div>
    </aside>
    <main className="main">
      <div className="topbar">
        <button className="iconbtn mobile-menu" aria-label="Открыть меню" onClick={()=>setMenu(!menu)}><Menu/></button>
        <span className="topbar-spacer"/>
        <Select ariaLabel="Выбрать бизнес" className={`company-switch company-${company}`} value={company} disabled={!!currentUser&&currentUser.company!=="all"} onChange={value=>{const next=value as Company;setCompany(next);window.localStorage.setItem(`garik-company:${themeOwner}`,next);navigate("dashboard")}} options={[{value:"all",label:"Все компании"},{value:"import",label:"GARIK IMPORT"},{value:"retail",label:"GARIK RETAIL"}]}/>
        <button className="iconbtn theme-toggle" aria-label={theme==="light"?"Включить темную тему":"Включить светлую тему"} title={theme==="light"?"Светлая тема":"Темная тема"} onClick={toggleTheme}>{theme==="light"?<Moon/>:<Sun/>}</button>
        <button className="iconbtn" aria-label="Уведомления"><Bell/></button>
        <button aria-label={observer?`Режим наблюдателя: ${observer}`:"Войти как пользователь"} className={`observer-btn ${observer?"active":""}`} onClick={()=>setObserverOpen(true)}><Eye/><span>{observer?currentUser?.name:"Войти как пользователь"}<small>{observer?currentUser?.title:"Проверка ролей и прав"}</small></span></button>
        <div className="avatar"><span>{observer?observer.split(" ").map(x=>x[0]).slice(0,2).join(""):"АЮ"}</span><div><strong>{observer||"Алишер Юсупов"}</strong><small>{role}</small></div></div>
      </div>
      {observer&&<div className="observer-strip"><Eye/><span>Ты смотришь систему глазами пользователя <strong>{observer}</strong> · {role}</span><button onClick={()=>impersonate("")}>Выйти из режима</button></div>}
      <div className={`contextbar company-${company}`} data-testid="business-context"><span className="context-code">{companyInfo[company].code}</span><div><strong>{companyInfo[company].name}</strong><small>{companyInfo[company].short}</small></div>{company==="all"&&<span className="consolidated">Консолидированные данные двух бизнесов</span>}</div>
      <div className="pagehead"><div><h1 className="mid">{titles[page][0]}</h1><p>{titles[page][1]} · {companyInfo[company].name}</p></div><div className="page-actions"><button className="ghost data-exchange-trigger" onClick={()=>setDataExchangeOpen(true)}><FileSpreadsheet/>Импорт и экспорт</button><Action page={page} open={setModal} role={role} exportReport={()=>void exportWordReport(page,company,rows).then(()=>done("Отчет Word выгружен")).catch(()=>setToast("Не удалось выгрузить отчет"))}/></div></div>
      {apiError?<PageState kind="error" message={apiError} retry={()=>{invalidatePage(page,company);setReloadNonce(value=>value+1)}}/>:loading||!pageDataReady?<PageState kind="loading"/>:page!=="dashboard"&&page!=="debts"&&rows.length===0?<PageState kind="empty"/>:<>
      {page==="dashboard"&&<DashboardPage><Dashboard openPage={openPage} company={company} d={selected}/></DashboardPage>}
      {page==="warehouses"&&<WarehousesPage rows={rows as string[][]} company={company} onMovements={openMovements}/>}
      {page==="products"&&<ProductsPage key={`${company}:${salesFilter}:${movementFilter}`} rows={filteredProducts} company={company} salesFilter={salesFilter} movementFilter={movementFilter}/>}
      {page==="movements"&&<ProductsPage rows={selected.products} company={company}/>}
      {page==="sales"&&<ProductsPage rows={selected.products} company={company} salesFilter=" "/>}
      {page==="clients"&&<ClientsPage rows={rows as string[][]} canCreate={role!=="Кладовщик"} onSales={openSales} onDebts={()=>navigate("debts")}/>}
      {page==="debts"&&<DebtsPage canCreate={role!=="Кладовщик"} onCreate={()=>setDebtOpen(true)} onPayment={()=>setModal("payment")} onMovements={openMovements} rows={rows as string[][]}/>}
      {page==="finance"&&<FinancePage rows={rows as string[][]} company={company}/>}
      {page==="employees"&&<EmployeesPage rows={rows as string[]} company={company}/>}
      {page==="reports"&&<ReportsPage rows={rows as string[]} done={done} company={company}/>}
      </>}
    </main>
    {modal==="payment"&&<PaymentModal close={()=>setModal(null)} done={done} company={company}/>}
    {modal&&modal!=="payment"&&<OperationModal type={modal} close={()=>setModal(null)} done={done} company={company}/>}
    {dataExchangeOpen&&<DataExchangeModal company={company} close={()=>setDataExchangeOpen(false)} done={done}/>}
    {debtOpen&&<DebtModal company={company} role={role} close={()=>setDebtOpen(false)} done={text=>{setDebtOpen(false);done(text)}}/>}
    {observerOpen&&<ObserverModal current={observer} close={()=>setObserverOpen(false)} choose={impersonate}/>}
    {toast&&<div className="toast"><Check/>{toast}</div>}
  </div>
}

function DataState({kind,message,retry}:{kind:"loading"|"error"|"empty";message?:string;retry?:()=>void}){
  return <section className="card data-state" role={kind==="error"?"alert":"status"}><span className={`state-icon ${kind}`}><Boxes/></span><h2>{kind==="loading"?"Загружаем данные":kind==="error"?"Сервер данных недоступен":"В этом разделе пока нет данных"}</h2><p>{message??(kind==="loading"?"Получаем актуальные показатели из ERP API":"Выбери другой бизнес или раздел")}</p>{retry&&<button className="primary" onClick={retry}>Повторить</button>}</section>
}

function Action({page,open,role,exportReport}:{page:Page;open:(v:Modal)=>void;role:Role;exportReport:()=>void}){
  if(role==="Кладовщик"&&!["warehouses","movements"].includes(page))return null;
  if(role==="Продавец"&&!["sales","products","debts"].includes(page))return null;
  if(page==="sales"||page==="products"&&role==="Продавец")return <button className="primary" onClick={()=>open("sale")}><Plus/>Новая продажа</button>;
  if(page==="debts")return null;
  if(["warehouses","movements"].includes(page))return <button className="primary" onClick={()=>open("transfer")}><ArrowRightLeft/>Переместить товар</button>;
  return <button className="primary" onClick={exportReport}><Download/>Выгрузить отчет</button>
}
function Dashboard({openPage,company,d}:{openPage:(p:Page)=>void;company:Company;d:BusinessData}){
  const router=useRouter();
  const currentYear=new Date().getFullYear();
  const [salesPeriod,setSalesPeriod]=useState("days");
  const [salesYear,setSalesYear]=useState(String(currentYear));
  const [salesMonth,setSalesMonth]=useState(String(new Date().getMonth()+1));
  const trendKey=`${company}:${salesPeriod}:${salesYear}:${salesMonth}`;
  const [trendResult,setTrendResult]=useState<{key:string;points:SalesTrendPoint[]}>({key:"",points:[]});
  useEffect(()=>{const controller=new AbortController();fetch(`${API_URL}/api/dashboard/sales-trend?scope=${company}&period=${salesPeriod}&year=${salesYear}&month=${salesMonth}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();setTrendResult({key:trendKey,points:await response.json()})}).catch(reason=>{if(reason?.name!=="AbortError")setTrendResult({key:trendKey,points:[]})});return()=>controller.abort()},[company,salesPeriod,salesYear,salesMonth,trendKey]);
  const trend=trendResult.key===trendKey?trendResult.points:[],trendLoading=trendResult.key!==trendKey;
  const maxSale=Math.max(...trend.map(point=>point.amount),1);
  const bars=trend.map(point=>Math.max(point.amount?8:2,Math.round(point.amount*100/maxSale)));
  const axisMax=Math.ceil(maxSale/1_000_000)*1_000_000||1_000_000;
  const axisTicks=[axisMax,Math.round(axisMax*.75),Math.round(axisMax*.5),Math.round(axisMax*.25),0];
  const formatAxis=(value:number)=>value>=1_000_000_000?`${(value/1_000_000_000).toLocaleString("ru-RU",{maximumFractionDigits:1})} млрд`:value>=1_000_000?`${(value/1_000_000).toLocaleString("ru-RU",{maximumFractionDigits:1})} млн`:value>=1_000?`${Math.round(value/1_000)} тыс.`:`${value}`;
  const drillTrend=(index:number)=>{if(salesPeriod==="years"){setSalesYear(trend[index].label);setSalesPeriod("months");return}if(salesPeriod==="months"){setSalesMonth(String(index+1));setSalesPeriod("days");return}const day=trend[index].label.slice(0,2);router.push(`/finance?date=${salesYear}-${salesMonth.padStart(2,"0")}-${day}`)};
  const retailStockValue=d.products.reduce((sum,row)=>sum+Number((row[4]??"0").replace(/\D/g,""))*Number((row[7]??row[6]??"0").replace(/\D/g,"")),0);
  const heroItems:[string,string,string,Page][]=[["Выручка",d.hero[1],"Открыть продажи в кассе","finance"],["Денежные средства",d.hero[2],"Кассы и счета","finance"],["Товаров на складах",d.hero[3],`${d.warehouses.length} точек хранения`,"products"],["Стоимость запасов",d.hero[4],`Розничная: ${retailStockValue.toLocaleString("ru-RU")} сум`,"warehouses"]];
  return <><section className={`hero hero-${company}`}><div className="hero-top"><div><h2 className="display">{d.hero[0]}</h2><p>{company==="all"?"Импорт и розница считаются независимо, а здесь показана объединенная аналитика группы.":company==="import"?"Только оптовые поставки, импортные склады, дилеры и расчеты GARIK IMPORT.":"Только магазин, розничные склады, покупатели и кассы GARIK RETAIL."}</p></div><span className="hero-badge">Данные на 31 июля 2026</span></div><div className="hero-stats">{heroItems.map(item=><button className="hero-stat interactive-card" key={item[0]} onClick={()=>openPage(item[3])} aria-label={`${item[0]} - открыть подробный отчет`}><small>{item[0]}</small><strong>{item[1]}</strong><em>{item[2]}</em><span className="open-hint">Подробнее</span></button>)}</div></section>
  <div className="kpis"><Kpi icon={CircleDollarSign} label="Выручка за июль" value={d.kpi[0]} trend="+12,6% к июню" onClick={()=>openPage("sales")}/><Kpi icon={WalletCards} label="Дебиторская задолженность" value={d.kpi[1]} trend={`${d.debts.filter((x:any)=>x[5]==="Просрочен").length} просроченных долга`} kind="red" onClick={()=>openPage("debts")}/><Kpi icon={Boxes} label="Стоимость остатков" value={d.kpi[2]} trend={`${d.products.filter((x:any)=>x[7]==="Мало").length} товара ниже минимума`} kind="warn" onClick={()=>openPage("products")}/><Kpi icon={BarChart3} label="Валовая прибыль" value={d.kpi[3]} trend="Маржа 19,5%" onClick={()=>openPage("finance")}/></div>
  <div className="grid2"><section className="card panel"><div className="panel-title"><div><h3>Динамика продаж</h3><span>{salesPeriod==="years"?"Доходы за последние 5 лет":salesPeriod==="months"?`Доходы по месяцам ${salesYear} года`:`Доходы по дням ${salesMonth.padStart(2,"0")}.${salesYear}`}, сум</span></div><div className="trend-filters"><Select ariaLabel="Период динамики продаж" value={salesPeriod} onChange={setSalesPeriod} options={[{value:"days",label:"Дни"},{value:"months",label:"Месяцы"},{value:"years",label:"Годы"}]}/></div></div>{trendLoading?<div className="chart-state">Загружаем динамику...</div>:trend.length?<div className="sales-chart"><div className="sales-axis" aria-hidden="true">{axisTicks.map(value=><span key={value}>{formatAxis(value)}</span>)}</div><div className="chart-viewport chart-grid" tabIndex={0} aria-label={salesPeriod==="days"?"График по дням. Нажмите на день, чтобы открыть продажи в кассе":salesPeriod==="months"?"График по месяцам. Нажмите на месяц, чтобы увидеть дни":"График за последние пять лет. Нажмите на год, чтобы увидеть месяцы"}><div className={`chart chart-${salesPeriod}`}>{bars.map((b,i)=><button type="button" className="barwrap chart-drill" key={`${trend[i].label}-${i}`} onClick={()=>drillTrend(i)} aria-label={`${trend[i].label}: ${trend[i].amount.toLocaleString("ru-RU")} сум`}><span className="bar" title={`${trend[i].label}: ${trend[i].amount.toLocaleString("ru-RU")} сум`} style={{height:`${b}%`,animationDelay:`${i*35}ms`}}/><small title={trend[i].label}>{trend[i].label}</small></button>)}</div></div></div>:<div className="chart-state">За выбранный период продаж нет</div>}<button className="panel-link chart-link" onClick={()=>openPage("finance")}>Открыть продажи в кассе</button></section>
  <section className="card panel"><div className="panel-title"><div><h3>Требуют внимания</h3><span>{d.debts.filter((x:any)=>x[5]==="Просрочен").length+d.products.filter((x:any)=>x[7]==="Мало").length} события</span></div><button className="ghost" onClick={()=>openPage("debts")}>Открыть все</button></div><div className="alerts"><Alert kind="red" title={`${d.debts.filter((x:any)=>x[5]==="Просрочен").length} просроченных долга`} desc={`${d.debts.filter((x:any)=>x[5]==="Просрочен").reduce((s:number,x:any)=>s+Number(x[2].replaceAll(" ","")),0).toLocaleString("ru-RU")} сум в выбранном бизнесе`} value="Открыть" onClick={()=>openPage("debts")}/><Alert title={`Низкий остаток ${d.products.filter((x:any)=>x[7]==="Мало").length} товаров`} desc={d.products.find((x:any)=>x[7]==="Мало")?.[1]||"Критичных остатков нет"} value="Открыть" onClick={()=>openPage("products")}/></div></section></div></>
}
function Kpi({icon:Icon,label,value,trend,kind="",onClick}:{icon:IconComponent;label:string;value:string;trend:string;kind?:string;onClick?:()=>void}){const content=<><div className="kpi-top"><small>{label}</small><span className={`kpi-icon ${kind}`}><Icon/></span></div><strong>{value}</strong><span className={`trend ${kind==="red"?"red":""}`}>{trend}</span>{onClick&&<span className="open-hint">Подробнее</span>}</>;return onClick?<button className="card kpi interactive-card" onClick={onClick} aria-label={`${label} - открыть подробный отчет`}>{content}</button>:<div className="card kpi">{content}</div>}
function Alert({kind="",title,desc,value,onClick}:{kind?:string;title:string;desc:string;value:string;onClick?:()=>void}){return <button className="alert interactive-row" onClick={onClick}><span className={`alert-icon ${kind}`}><AlertTriangle size={15}/></span><span><strong>{title}</strong><small>{desc}</small></span><b>{value}</b></button>}
function FilterSelect({label,values}:{label:string;values:string[]}){const [value,setValue]=useState(values[0]);return <Select ariaLabel={label} className="filter-select" value={value} onChange={setValue} options={values.map(item=>({value:item,label:item}))}/>}
const staticSelect=(label:string,values:string[])=><FilterSelect label={label} values={values}/>;
function Warehouses({rows,company}:{rows:string[][];company:Company}){return <><div className="toolbar"><span className={`business-chip company-${company}`}>{companyInfo[company].name}</span>{staticSelect("Фильтр по типу склада",["Все типы","Магазин","Удаленный склад"])}<span className="spacer"/><span className="count">{rows.length} точек · данные только выбранного бизнеса</span></div><div className="warehouse-grid">{rows.map(w=><div className="card warehouse" key={w[0]}><div className="warehouse-head"><span className="warehouse-icon">{/магазин/i.test(w[0])?<Store/>:<Warehouse/>}</span><span className="badge">Активен</span></div><h3>{w[0]}</h3><p>{w[1]}</p><div className="warehouse-stats"><div className="mini"><small>Остаток</small><strong>{w[2]} ед.</strong></div><div className="mini"><small>Стоимость</small><strong>{w[3]}</strong></div></div><div style={{marginTop:10}}><div className="progress"><span style={{width:w[4]}}/></div></div></div>)}</div></>}
function Products({rows}:{rows:string[][]}){return <><div className="toolbar">{staticSelect("Фильтр по складу",["Все склады","Склад импорта","Магазин Сергели"])}{staticSelect("Фильтр по бренду",["Все бренды","Ravenol","Liqui Moly","Fuchs"])}<span className="spacer"/><span className="count">{rows.length} позиций показано</span></div><div className="card tablecard"><div className="table-scroll"><table className="table"><thead><tr><th>Товар</th><th>Бренд</th><th>Фасовка</th><th>Факт</th><th>Резерв</th><th>Цена</th><th>Статус</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]}><td><div className="cell-title"><span className="product-icon">OIL</span><div><strong>{r[1]}</strong><small>{r[0]}</small></div></div></td><td>{r[2]}</td><td>{r[3]}</td><td className="money">{r[4]} ед.</td><td>{r[5]} ед.</td><td>{r[6]} сум</td><td><span className={`badge ${r[7]==="Мало"?"amber":""}`}>{r[7]}</span></td></tr>)}</tbody></table></div></div></>}
function Movements({rows}:{rows:string[][]}){return <><div className="toolbar">{staticSelect("Фильтр по операции",["Все операции","Поступления","Перемещения","Списания"])}<input className="filter" type="date" aria-label="Дата движения" defaultValue="2026-07-31"/><span className="spacer"/><button className="ghost"><Download size={13}/> XLSX</button></div><DataTable headers={["Документ","Операция","Откуда / поставщик","Куда / клиент","Дата","Статус"]} rows={rows}/></>}
function Sales({rows,d}:{rows:string[][];d:any}){return <><div className="kpis"><Kpi icon={ShoppingCart} label="Продажи сегодня" value={d.kpi[0]} trend={`${rows.length} документа в выборке`}/><Kpi icon={CircleDollarSign} label="Оплачено" value={d.hero[2]} trend="Поступления по бизнесу"/><Kpi icon={WalletCards} label="Продано в долг" value={d.kpi[1]} trend="Текущая дебиторка" kind="warn"/><Kpi icon={Package} label="Товаров в контуре" value={d.hero[3]} trend={`${d.warehouses.length} складских точек`}/></div><DataTable headers={["Документ","Дата","Клиент","Склад","Сумма","Оплата"]} rows={rows}/></>}
function Clients({rows,staff,canCreate}:{rows:string[][];staff:string[];canCreate:boolean}){return <><div className="toolbar">{staticSelect("Фильтр по типу клиента",["Все типы клиентов","Корпоративные","Мелкий опт","Розница"])}{staticSelect("Фильтр по ответственному",["Все ответственные",...staff.map(x=>x.split(" · ")[0])])}<span className="spacer"/>{canCreate&&<button className="primary"><Plus/>Новый клиент</button>}</div><div className="split">{rows.map(c=><div className="card debt-card" key={c[0]}><div className="debt-head"><span className="company-logo">{c[0].split(" ").map(x=>x[0]).slice(0,2).join("")}</span><div><h3>{c[0]}</h3><p>{c[1]} · Ответственный: {c[5]}</p></div><div className="debt-amount"><strong>{c[3]} сум</strong><small>{c[3]==="0"?"Нет долга":`до ${c[4]}`}</small></div></div><div className="debt-meta"><div className="mini"><small>Кредитный лимит</small><strong>{c[2]}</strong></div><div className="mini"><small>Текущий долг</small><strong>{c[3]}</strong></div><div className="mini"><small>История</small><strong>24 операции</strong></div></div></div>)}</div></>}
function Debts({open,rows,d}:{open:(m:Modal)=>void;rows:string[][];d:any}){return <><div className="kpis"><Kpi icon={WalletCards} label="Общий долг клиентов" value={d.kpi[1]} trend={`${rows.length} открытых документа`}/><Kpi icon={AlertTriangle} label="Просрочено" value={`${rows.filter(r=>r[5]==="Просрочен").length} клиента`} trend="Требуют внимания" kind="red"/><Kpi icon={CircleDollarSign} label="Ожидаем за 7 дней" value={rows[0]?.[2]||"0"} trend="По выбранному бизнесу"/><Kpi icon={Bell} label="Напоминания" value={`${rows.length*2} отправлено`} trend="Telegram сегодня"/></div><DataTable headers={["Клиент","Направление","Долг","Срок","Ответственный","Статус"]} rows={rows} action={<button className="ghost" onClick={()=>open("payment")}>Принять оплату</button>}/></>}
function Finance({rows,d}:{rows:string[][];d:any}){return <><div className="kpis"><Kpi icon={CircleDollarSign} label="Поступления за месяц" value={d.kpi[0]} trend="+11,4% к июню"/><Kpi icon={ArrowDownToLine} label="Дебиторская задолженность" value={d.kpi[1]} trend="По выбранному контуру" kind="warn"/><Kpi icon={BarChart3} label="Валовая прибыль" value={d.kpi[3]} trend="Положительная"/><Kpi icon={AlertTriangle} label="Стоимость запасов" value={d.kpi[2]} trend="На текущую дату"/></div><div className="grid2"><section className="card panel"><div className="panel-title"><div><h3>Кассовый прогноз</h3><span>Факт и план на 30 дней</span></div><span className="badge">Разрыва нет</span></div><div className="chart">{[70,64,58,72,67,55,61,75,81,78,88,84].map((v,i)=><div className="barwrap" key={i}><div className={`bar ${i>7?"alt":""}`} style={{height:`${v}%`}}/><small>{i+1}</small></div>)}</div></section><section className="card panel"><div className="panel-title"><h3>Кассы и счета</h3><span>{rows.length} счета</span></div><div className="alerts">{rows.map(c=><div className="alert" key={c[0]+c[1]}><span className="alert-icon"><CircleDollarSign size={15}/></span><div><strong>{c[0]}</strong><small>{c[1]} · {c[3]}</small></div><b>{c[2]}</b></div>)}</div></section></div></>}
function Employees({rows,company}:{rows:string[];company:Company}){return <><div className="toolbar"><span className={`business-chip company-${company}`}>{companyInfo[company].name}</span><span className="spacer"/><span className="count">{rows.length} сотрудников в доступном контуре</span></div><div className="report-grid">{rows.map((x,i)=>{const [name,title]=x.split(" · ");return <div className="card report" key={x}><span className="company-logo">{name.split(" ").map(v=>v[0]).slice(0,2).join("")}</span><div><strong>{name}</strong><small>{title} · {companyInfo[company].code}</small></div><span className="badge">Активен</span></div>})}</div></>}
function Reports({done,company}:{done:(t:string)=>void;company:Company}){const rs=[["Остатки на дату","Складской учет"],["Движение товара","Складской учет"],["Продажи по товарам","Продажи"],["Валовая прибыль","Финансы"],["Дебиторская задолженность","Взаиморасчеты"],["Просроченные долги","Взаиморасчеты"],["Движение денежных средств","Финансы"],["Кассовый прогноз","Финансы"],["Журнал действий","Безопасность"]];async function generate(name:string){const response=await fetch(`${API_URL}/api/reports/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,scope:company,format:"xlsx"})});done(response.ok?`Отчет «${name}» для ${companyInfo[company].name} сформирован`:"Не удалось сформировать отчет")};return <><div className={`report-scope company-${company}`}><ShieldCheck/><div><strong>Контур отчета: {companyInfo[company].name}</strong><small>{company==="all"?"В отчет попадут консолидированные данные с разбивкой по двум бизнесам.":"В отчет попадут только данные выбранного бизнеса."}</small></div></div><div className="report-grid">{rs.map(r=><div className="card report" key={r[0]}><FileSpreadsheet/><div><strong>{r[0]}</strong><small>{companyInfo[company].code} · {r[1]} · XLSX / PDF</small></div><button aria-label={`Сформировать отчет ${r[0]}`} onClick={()=>void generate(r[0])}><Download size={14}/></button></div>)}</div></>}
function DataTable({headers,rows,action}:{headers:string[];rows:string[][];action?:React.ReactNode}){return <div className="card tablecard"><div className="table-scroll"><table className="table"><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{j===0?<strong>{c}</strong>:j===r.length-1?<span className={`badge ${/Просрочен/.test(c)?"red":/Скоро|Частично|На проверке|В пути/.test(c)?"amber":""}`}>{c}</span>:c}</td>)}</tr>)}</tbody></table></div>{action&&<div style={{padding:12,textAlign:"right"}}>{action}</div>}</div>}
type ExchangeEntity="products"|"clients"|"warehouses"|"debts";
type ImportPreview={entity:string;totalRows:number;rows:string[][];errors:string[]};
function DataExchangeModal({company,close,done}:{company:Company;close:()=>void;done:(text:string)=>void}){
 const [entity,setEntity]=useState<ExchangeEntity>("products"),[scope,setScope]=useState<"import"|"retail">(company==="retail"?"retail":"import"),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<ImportPreview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow="hidden";const key=(event:KeyboardEvent)=>{if(event.key==="Escape")close()};window.addEventListener("keydown",key);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",key)}},[close]);
 async function request(path:"preview"|"import"){
  if(!file){setError("Выбери Excel-файл .xlsx");return}
  setBusy(true);setError("");const body=new FormData();body.append("entity",entity);body.append("scope",scope);body.append("file",file);
  try{const response=await fetch(`${API_URL}/api/data-exchange/${path}`,{method:"POST",body});const result=await response.json();if(!response.ok)throw new Error(result.message??result.errors?.[0]??"Не удалось обработать файл");if(path==="preview")setPreview(result as ImportPreview);else done(result.message??"Данные импортированы")}
  catch(reason){setError(reason instanceof Error?reason.message:"Не удалось обработать файл")}
  finally{setBusy(false)}
 }
 const labels:{value:ExchangeEntity;label:string}[]=[{value:"products",label:"Товары"},{value:"clients",label:"Клиенты"},{value:"warehouses",label:"Склады"},{value:"debts",label:"Долги"}];
 const formatGuide:Record<ExchangeEntity,string[]>={products:["Артикул","Название","Бренд","Фасовка","Количество","Резерв","Цена","Статус"],clients:["Клиент","Тип","Кредитный лимит","Долг","Срок","Ответственный"],warehouses:["Склад","Тип","Количество","Стоимость","Заполнение"],debts:["Клиент","Направление","Сумма","Срок","Ответственный","Статус"]};
 return <div className="modalback" role="presentation" onMouseDown={event=>{if(event.currentTarget===event.target)close()}}><section className="modal exchange-modal" role="dialog" aria-modal="true" aria-labelledby="exchange-title">
  <div className="modalhead"><div><h2 id="exchange-title">Импорт и экспорт данных</h2><small>Файлы Excel .xlsx, до 1 000 строк</small></div><button className="close" aria-label="Закрыть" onClick={close}><X/></button></div>
  <div className="form exchange-form"><div className="exchange-grid"><div className="field"><label>Тип данных</label><Select ariaLabel="Тип данных" value={entity} onChange={value=>{setEntity(value as ExchangeEntity);setPreview(null)}} options={labels}/></div><div className="field"><label>Компания для импорта</label><Select ariaLabel="Компания для импорта" value={scope} onChange={value=>{setScope(value as "import"|"retail");setPreview(null)}} options={[{value:"import",label:"GARIK IMPORT"},{value:"retail",label:"GARIK RETAIL"}]}/></div></div>
   <aside className="format-guide" aria-label="Как подготовить Excel-файл"><strong>Как подготовить документ</strong><p>Первая строка - заголовки строго в указанном порядке. Каждая следующая строка - одна запись. Не объединяй ячейки и не оставляй обязательные поля пустыми.</p><div className="format-columns">{formatGuide[entity].map((column,index)=><span key={column}><b>{index+1}</b>{column}</span>)}</div></aside>
   <label className={`file-drop ${file?"has-file":""}`}><FileSpreadsheet/><strong>{file?file.name:"Выбери Excel-файл"}</strong><span>{file?`${Math.ceil(file.size/1024)} КБ`:".xlsx, максимум 10 МБ"}</span><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event=>{setFile(event.target.files?.[0]??null);setPreview(null);setError("")}}/></label>
   <div className="exchange-actions"><button className="ghost" disabled={busy} onClick={()=>void request("preview")}><Eye/>Предпросмотр</button><a className="ghost" href={`${API_URL}/api/data-exchange/export/${entity}.xlsx?scope=${company}`} download><Download/>Скачать Excel .xlsx</a></div>
   {error&&<p className="form-error" role="alert">{error}</p>}
   {preview&&<div className="preview-block"><div className="preview-summary"><strong>{preview.totalRows} строк найдено</strong><span className={preview.errors.length?"preview-errors":"preview-ok"}>{preview.errors.length?`${preview.errors.length} ошибок`:"Проверка пройдена"}</span></div>{preview.errors.length>0&&<ul>{preview.errors.slice(0,5).map(item=><li key={item}>{item}</li>)}</ul>}<div className="table-scroll"><table className="table preview-table"><tbody>{preview.rows.map((row,index)=><tr key={index}>{row.map((cell,cellIndex)=><td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div></div>}
  </div>
  <div className="modalfoot"><button className="ghost" onClick={close}>Отмена</button><button className="primary" disabled={busy||!preview||preview.errors.length>0} onClick={()=>void request("import")}><ArrowDownToLine/>{busy?"Обработка...":"Импортировать данные"}</button></div>
 </section></div>
}
function DebtModal({company,role,close,done}:{company:Company;role:Role;close:()=>void;done:(text:string)=>void}){
 const initialScope: "import"|"retail"=company==="retail"?"retail":"import";
 const [scope,setScope]=useState<"import"|"retail">(initialScope),[kind,setKind]=useState("receivable"),[customer,setCustomer]=useState(""),[store,setStore]=useState(data[initialScope].warehouses[0]?.[0]??""),[amount,setAmount]=useState(""),[dueDate,setDueDate]=useState("2026-08-20"),[manager,setManager]=useState(data[initialScope].staff.find(item=>!item.includes("Кладовщик"))?.split(" · ")[0]??""),[comment,setComment]=useState(""),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const details=data[scope], managers=details.staff.filter(item=>!item.includes("Кладовщик")).map(item=>item.split(" · ")[0]);
 function changeScope(value:string){const next=value as "import"|"retail";setScope(next);setStore(data[next].warehouses[0]?.[0]??"");setManager(data[next].staff.find(item=>!item.includes("Кладовщик"))?.split(" · ")[0]??"")}
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow="hidden";const key=(event:KeyboardEvent)=>{if(event.key==="Escape")close()};window.addEventListener("keydown",key);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",key)}},[close]);
 async function submit(){
  if(!customer.trim()||!amount.trim()||!dueDate||!store||!manager){setError("Заполни контрагента, магазин, сумму, срок и ответственного");return}
  setSaving(true);setError("");
  const body={businessId:scope==="import"?1:2,kind,customer:customer.trim(),store,amount:amount.replace(/\D/g,""),dueDate:new Date(`${dueDate}T00:00:00`).toLocaleDateString("ru-RU"),manager,comment:comment.trim()};
  try{const response=await fetch(`${API_URL}/api/debts`,{method:"POST",headers:{"Content-Type":"application/json","X-User-Role":role},body:JSON.stringify(body)});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.message??"Не удалось добавить долг");done(kind==="payable"?"Долг производителю добавлен":"Долг покупателя добавлен")}
  catch(reason){setError(reason instanceof Error?reason.message:"Не удалось добавить долг")}
  finally{setSaving(false)}
 }
 return <div className="modalback" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}><section className="modal debt-modal" role="dialog" aria-modal="true" aria-labelledby="debt-modal-title"><div className="modalhead"><div><h2 id="debt-modal-title">Добавить долг</h2><small>Задолженность покупателя или перед производителем</small></div><button className="close" aria-label="Закрыть окно" onClick={close}><X/></button></div><div className="form"><div className="formgrid">
  {company==="all"&&<div className="field"><label>Компания</label><Select ariaLabel="Компания долга" value={scope} onChange={changeScope} options={[{value:"import",label:"GARIK IMPORT"},{value:"retail",label:"GARIK RETAIL"}]}/></div>}
  <div className="field"><label>Тип долга</label><Select ariaLabel="Тип долга" value={kind} onChange={setKind} options={[{value:"receivable",label:"Нам должен покупатель"},{value:"payable",label:"Мы должны производителю"}]}/></div>
  <div className="field"><label>{kind==="payable"?"Производитель или поставщик":"Покупатель"}</label><input aria-label={kind==="payable"?"Производитель или поставщик":"Покупатель"} value={customer} onChange={event=>setCustomer(event.target.value)} placeholder={kind==="payable"?"Например, Ravenol GmbH":"Название или ФИО"}/></div>
  <div className="field"><label>Магазин</label><Select ariaLabel="Магазин долга" value={store} onChange={setStore} options={details.warehouses.map(item=>({value:item[0],label:item[0]}))}/></div>
  <div className="field"><label>Сумма, сум</label><input aria-label="Сумма, сум" inputMode="numeric" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="Например, 18 400 000"/></div>
  <div className="field"><label>Срок оплаты</label><input aria-label="Срок оплаты" type="date" value={dueDate} onChange={event=>setDueDate(event.target.value)}/></div>
  <div className="field"><label>Ответственный</label><Select ariaLabel="Ответственный за долг" value={manager} onChange={setManager} options={managers.map(item=>({value:item,label:item}))}/></div>
  <div className="field full"><label>Комментарий</label><textarea aria-label="Комментарий" value={comment} onChange={event=>setComment(event.target.value)} placeholder="Основание или детали договоренности" rows={3}/></div>
 </div>{error&&<p className="form-error" role="alert">{error}</p>}</div><div className="modalfoot"><button className="ghost" onClick={close}>Отмена</button><button className="primary" disabled={saving} onClick={()=>void submit()}><Plus/>{saving?"Сохраняем...":"Добавить долг"}</button></div></section></div>
}
function OperationModal({type,close,done,company}:{type:Exclude<Modal,null>;close:()=>void;done:(t:string)=>void;company:Company}){
 const cfg={sale:["Новая продажа","Провести продажу"],payment:["Регистрация оплаты","Зарегистрировать оплату"],transfer:["Перемещение товара","Создать перемещение"]}[type];
 const [scope,setScope]=useState<"import"|"retail">(company==="retail"?"retail":"import"), d=data[scope];
 const [saving,setSaving]=useState(false),[error,setError]=useState("");
 async function submit(){setSaving(true);setError("");const businessId=scope==="import"?1:2;const firstProductId=scope==="import"?1:5;const config=type==="sale"?{url:"/api/sales/new-sale",body:{businessId,customer:d.clients[0][0],warehouse:d.warehouses[0][0],store:d.warehouses[0][0],amount:"17 160 000",paymentStatus:"В долг",lines:[{productId:firstProductId,quantity:24},{productId:firstProductId+1,quantity:8}]}}:type==="payment"?{url:"/api/debts/payment",body:{debtId:scope==="import"?1:4,amount:"8 700 000"}}:{url:"/api/movements/transfer",body:{businessId,source:d.warehouses[0][0],destination:d.warehouses[1]?.[0]??d.warehouses[0][0]}};try{const response=await fetch(`${API_URL}${config.url}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(config.body)});if(!response.ok)throw new Error();done(type==="sale"?"Продажа проведена, партии списаны по FIFO":type==="payment"?"Оплата зарегистрирована, долг обновлен":"Перемещение создано на сервере")}catch{setError("Сервер не сохранил операцию. Проверь соединение и повтори.")}finally{setSaving(false)}}
 return <div className="modalback" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modalhead"><div><h2>{cfg[0]}</h2><small>{company==="all"?"Выбери бизнес операции · по умолчанию GARIK IMPORT":companyInfo[company].name}</small></div><button className="close" aria-label="Закрыть окно" onClick={close}><X size={16}/></button></div><div className="form"><div className="formgrid">
 {company==="all"&&<Field label="Бизнес операции"><Select ariaLabel="Бизнес операции" value={scope} onChange={value=>setScope(value as "import"|"retail")} options={[{value:"import",label:"GARIK IMPORT"},{value:"retail",label:"GARIK RETAIL"}]}/></Field>}
 {type==="sale"&&<><FieldSelect label="Клиент" values={d.clients.map(x=>x[0])}/><FieldSelect label="Склад" values={d.warehouses.map(x=>x[0])}/><FieldSelect label="Способ оплаты" values={["В долг","Полная оплата","Частичная оплата"]}/><Field label="Срок оплаты"><input type="date" defaultValue="2026-08-15"/></Field><div className="field full"><label>Товары</label><div className="lineitems">{d.products.slice(0,2).map((x,i)=><div className="lineitem" key={x[0]}><strong>{x[1]} · {x[3]}</strong><input aria-label={`Количество ${x[1]}`} defaultValue={i?8:24}/><input aria-label={`Цена ${x[1]}`} defaultValue={x[6]}/><X size={14}/></div>)}</div></div></>}
 {type==="payment"&&<><FieldSelect label="Клиент" values={["SERGELI MOTORS","OOO TASHKENT AUTO PARTS","Акмал Турсунов"]}/><FieldSelect label="Документ долга" values={["ПРД-01429 · 8 700 000 сум","ПРД-01431 · 18 400 000 сум"]}/><Field label="Сумма оплаты"><input defaultValue="8 700 000"/></Field><FieldSelect label="Касса или счет" values={["Расчетный счет UZS","Основная касса"]}/><Field label="Дата оплаты"><input type="date" defaultValue="2026-07-31"/></Field><Field label="Основание"><input defaultValue="Платежное поручение №184"/></Field></>}
 {type==="transfer"&&<><FieldSelect label="Склад-отправитель" values={d.warehouses.map(x=>x[0])}/><FieldSelect label="Склад-получатель" values={d.warehouses.slice().reverse().map(x=>x[0])}/><FieldSelect label="Товар" values={d.products.map(x=>`${x[1]} · ${x[3]}`)}/><Field label="Количество"><input type="number" min="1" defaultValue="24"/></Field><Field label="Дата отправки"><input type="date" defaultValue="2026-08-12"/></Field><FieldSelect label="Ответственный" values={d.staff.map(x=>x.split(" · ")[0])}/></>}
 </div>{type==="sale"&&<div className="summary"><div><small>Количество</small><strong>32 ед.</strong></div><div><small>Сумма продажи</small><strong>17 160 000 сум</strong></div><div><small>Кредитный лимит после</small><strong>88 440 000 сум</strong></div></div>}{error&&<p className="form-error" role="alert">{error}</p>}</div><div className="modalfoot"><button className="ghost" onClick={close}>Отмена</button><button className="primary" disabled={saving} onClick={()=>void submit()}><Check size={14}/>{saving?"Сохраняем...":cfg[1]}</button></div></div></div>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><label>{label}</label>{children}</label>}
function FieldSelect({label,values}:{label:string;values:string[]}){const [value,setValue]=useState(values[0]??"");return <Field label={label}><Select ariaLabel={label} value={value} onChange={setValue} options={values.map(item=>({value:item,label:item}))}/></Field>}

function ObserverModal({current,close,choose}:{current:string;close:()=>void;choose:(name:string)=>void}){
 return <div className="modalback" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal observer-modal"><div className="modalhead"><div><h2>Войти как пользователь</h2><small>Пароль сотрудника не требуется. Режим доступен директору и администратору.</small></div><button className="close" aria-label="Закрыть окно" onClick={close}><X size={16}/></button></div><div className="observer-intro"><Eye/><div><strong>Режим наблюдателя</strong><p>Меню, компания, права и действия изменятся точно так, как их видит выбранный сотрудник.</p></div></div><div className="observer-list">{observers.map(person=><button key={person.name} className={current===person.name?"selected":""} onClick={()=>choose(person.name)}><span>{person.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><div><strong>{person.name}</strong><small>{person.title} · {person.role}</small></div><b className={`company-tag company-${person.company}`}>{companyInfo[person.company].code}</b></button>)}</div>{current&&<div className="modalfoot"><button className="ghost" onClick={()=>choose("")}>Вернуться в свой аккаунт</button></div>}</div></div>
}
