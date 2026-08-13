import {expect,test} from "@playwright/test";

const json=(body:unknown)=>({status:200,contentType:"application/json",body:JSON.stringify(body)});

test.beforeEach(async({page})=>{
 await page.route("**/api/**",async route=>{
  const url=route.request().url();
  if(url.includes("/api/dashboard/"))return route.fulfill(json({hero:["ERP","1","2","3","4"],kpi:["1","2","3","4"],products:[],clients:[],movements:[],warehouses:[],sales:[],debts:[],cash:[],staff:[]}));
  if(url.includes("/api/products"))return route.fulfill(json([{sku:"RTL-1",name:"Масло",brand:"Ravenol",package:"4 л",quantity:"12",reserved:"0",price:"100",status:"В наличии"},{sku:"RTL-2",name:"Антифриз",brand:"Meguin",package:"5 л",quantity:"4",reserved:"1",price:"250",status:"Мало"}]));
  if(url.includes("/api/batches"))return route.fulfill(json([{batchNumber:"RTL-B-OLD",product:{sku:"RTL-1",name:"Масло"},supplier:"GARIK IMPORT",warehouse:"Магазин Сергели",arrivedAt:"2026-07-01T00:00:00Z",initialQuantity:10,availableQuantity:4},{batchNumber:"RTL-B-NEW",product:{sku:"RTL-1",name:"Масло"},supplier:"GARIK IMPORT",warehouse:"Магазин Сергели",arrivedAt:"2026-08-01T00:00:00Z",initialQuantity:10,availableQuantity:8}]));
  if(url.includes("/api/sales"))return route.fulfill(json([{number:"RTL-01429",date:"12.08.2026",customer:"SERGELI MOTORS",store:"Магазин Сергели",warehouse:"Магазин Сергели",amount:"12 700 000",paymentStatus:"В долг"}]));
  if(url.includes("/api/movements"))return route.fulfill(json([]));
  if(url.includes("/api/clients"))return route.fulfill(json([{name:"SERGELI MOTORS",type:"Опт",creditLimit:"1",debt:"2",dueDate:"15.08.2026",manager:"Бекзод"}]));
  if(url.includes("/api/debts"))return route.fulfill(json([{customer:"SERGELI MOTORS",store:"Магазин Сергели",direction:"Розница",amount:"2",dueDate:"15.08.2026",manager:"Бекзод",saleId:29,status:"Ожидается"}]));
  return route.fulfill(json([]));
 });
});

test("заголовки сортируют, а очистка сбрасывает сортировку",async({page})=>{
 await page.goto("/"); await page.getByRole("button",{name:"Товары и операции"}).click();
 await page.getByRole("button",{name:"Сортировать по столбцу Товар"}).click();
 await expect(page.locator("tbody tr").first()).toContainText("Антифриз");
 await page.getByRole("button",{name:"Очистить фильтры и сортировку"}).click();
 await expect(page.locator("tbody tr").first()).toContainText("Масло");
 await page.getByRole("tab",{name:"Продажи"}).click();
 await expect(page.getByText("В долг")).toHaveClass(/loan/);
});

test("мегавкладка показывает FIFO и продажи по магазину",async({page})=>{
 await page.goto("/"); await page.getByRole("button",{name:"Товары и операции"}).click();
 await page.getByRole("tab",{name:"Партии FIFO"}).click();
 const rows=page.locator("tbody tr"); await expect(rows).toHaveCount(2); await expect(rows.first()).toContainText("RTL-B-OLD");
 await page.getByRole("tab",{name:"Продажи"}).click();
 const saleRow=page.getByRole("row").filter({hasText:"RTL-01429"});
 await expect(saleRow.getByRole("cell",{name:"Магазин Сергели"})).toHaveCount(2);
});

test("клиент открывает продажи с готовым фильтром",async({page})=>{
 await page.goto("/"); await page.getByRole("button",{name:"Клиенты"}).click(); await page.getByRole("button",{name:/SERGELI MOTORS/}).click();
 await expect(page.getByRole("tab",{name:"Продажи"})).toHaveAttribute("aria-selected","true"); await expect(page.getByLabel("Фильтр товаров и операций")).toHaveValue("SERGELI MOTORS"); await expect(page.getByText("RTL-01429")).toBeVisible();
});

for(const width of [390,768,1280,1440]){
 for(const theme of ["light","dark"] as const){
  test(`мегавкладка ${width}px ${theme}`,async({page})=>{
   const browserErrors:string[]=[];
   page.on("pageerror",error=>browserErrors.push(error.message));
   await page.setViewportSize({width,height:900});
   await page.goto("/");
   if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();
   if(width<=820)await page.getByRole("button",{name:"Открыть меню"}).click();
   await page.getByRole("button",{name:"Товары и операции"}).click();
   await page.getByRole("tab",{name:"Партии FIFO"}).click();
   await expect(page.getByText("RTL-B-OLD")).toBeVisible();
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
   await page.waitForTimeout(500);
   expect(browserErrors).toEqual([]);
   if(width===390||width===1440)await page.screenshot({path:`test-results/product-operations-${width}-${theme}.png`,fullPage:true});
  });
 }
}
