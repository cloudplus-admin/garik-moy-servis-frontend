import {expect,test} from "@playwright/test";

const json=(body:unknown)=>({status:200,contentType:"application/json",body:JSON.stringify(body)});

test.beforeEach(async({page})=>{
 await page.route("**/api/**",async route=>{
  const url=route.request().url();
  if(url.includes("/api/application-configuration"))return route.fulfill(json({pages:[{pageKey:"products",title:"Товары и операции",subtitle:"Учет товаров",sortOrder:1}],businesses:[{id:1,code:"import",name:"GARIK IMPORT",summary:"Импорт"},{id:2,code:"retail",name:"GARIK RETAIL",summary:"Розница"}],observers:[{id:1,name:"Азиз Каримов",role:"Руководитель",company:"all",title:"Руководитель",employeeId:1}]}));
  if(url.includes("/api/dashboard/"))return route.fulfill(json({hero:["ERP","1","2","3","4"],kpi:["1","2","3","4"],products:[],clients:[],movements:[],warehouses:[],sales:[],debts:[],cash:[],staff:[]}));
  if(url.includes("/api/products"))return route.fulfill(json([{sku:"RTL-1",name:"Масло",brand:"Ravenol",package:"4 л",quantity:"12",reserved:"0",price:"100",status:"В наличии"},{sku:"RTL-2",name:"Антифриз",brand:"Meguin",package:"5 л",quantity:"4",reserved:"1",price:"250",status:"Мало"}]));
  if(url.includes("/api/batches"))return route.fulfill(json([{batchNumber:"RTL-B-OLD",product:{sku:"RTL-1",name:"Масло"},supplier:"GARIK IMPORT",warehouse:"Магазин Сергели",arrivedAt:"2026-07-01T00:00:00Z",initialQuantity:10,availableQuantity:4},{batchNumber:"RTL-B-NEW",product:{sku:"RTL-1",name:"Масло"},supplier:"GARIK IMPORT",warehouse:"Магазин Сергели",arrivedAt:"2026-08-01T00:00:00Z",initialQuantity:10,availableQuantity:8}]));
  if(url.includes("/api/sales"))return route.fulfill(json([{number:"RTL-01429",date:"12.08.2026",customer:"SERGELI MOTORS",store:"Магазин Сергели",warehouse:"Магазин Сергели",amount:"12 700 000",paymentStatus:"В долг"}]));
  if(url.includes("/api/movements/filter-options"))return route.fulfill(json({statuses:["Проведен","В пути"],operations:["Оприходование","Перемещение"],suppliers:["GARIK IMPORT"],warehouses:["Магазин Сергели"],products:["RTL-1"],batches:["RTL-B-OLD"]}));
  if(url.includes("/api/movements"))return route.fulfill(json([{number:"STOCK-7",operation:"Оприходование",source:"Начальный остаток",destination:"Магазин Сергели",date:"01.08.2026 09:00",status:"Проведен",productSku:"RTL-1",productName:"Масло",batchNumber:"RTL-B-OLD",quantity:12}]));
  if(url.includes("/api/clients"))return route.fulfill(json([{name:"SERGELI MOTORS",type:"Опт",creditLimit:"1",debt:"2",dueDate:"15.08.2026",manager:"Бекзод"}]));
  if(url.includes("/api/debts"))return route.fulfill(json([{customer:"SERGELI MOTORS",store:"Магазин Сергели",direction:"Розница",amount:"2",dueDate:"15.08.2026",manager:"Бекзод",saleId:29,status:"Ожидается"}]));
  return route.fulfill(json([]));
 });
});

test("заголовки сортируют, а очистка сбрасывает сортировку",async({page})=>{
 await page.goto("/"); await page.getByRole("button",{name:"Товары и операции"}).click();
 await page.getByRole("button",{name:"Сортировать по столбцу Бренд"}).click();
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
 await expect(saleRow.getByRole("cell",{name:"Магазин Сергели"})).toHaveCount(1);
});

test("таблицы не показывают дублирующий товар и служебный ID",async({page})=>{
 await page.goto("/products");
 await expect(page.getByRole("columnheader",{name:"Товар",exact:true})).toHaveCount(0);
 await expect(page.getByRole("row").filter({hasText:"RTL-1"}).getByRole("cell")).toHaveCount(8);
 await page.getByRole("tab",{name:"Партии FIFO"}).click();
 await expect(page.getByRole("columnheader",{name:"Товар",exact:true})).toHaveCount(0);
 await expect(page.getByRole("row").filter({hasText:"RTL-B-OLD"})).toContainText("Масло");
 await page.getByRole("tab",{name:"Движения"}).click();
 await expect(page.getByRole("columnheader",{name:"Товар",exact:true})).toHaveCount(0);
 await expect(page.getByRole("row").filter({hasText:"STOCK-7"})).toContainText("Масло");
});

test("клиент открывает продажи с готовым фильтром",async({page})=>{
 await page.goto("/"); await page.getByRole("button",{name:"Клиенты"}).click(); await page.getByRole("button",{name:/SERGELI MOTORS/}).click();
 await expect(page.getByRole("tab",{name:"Продажи"})).toHaveAttribute("aria-selected","true"); await expect(page.getByLabel("Фильтр товаров и операций")).toHaveValue("SERGELI MOTORS"); await expect(page.getByText("RTL-01429")).toBeVisible();
});

test("структурный фильтр склада не скрывает найденное движение",async({page})=>{
 await page.goto("/products?tab=movements&sku=RTL-1&warehouse=%D0%9C%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD%20%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%BB%D0%B8");
 await expect(page.getByText("STOCK-7")).toBeVisible();
 await expect(page.getByRole("columnheader",{name:"Количество"})).toBeVisible();
 await expect(page.getByRole("row").filter({hasText:"STOCK-7"}).getByRole("cell",{name:"12"})).toBeVisible();
 await expect(page.getByLabel("Фильтр товаров и операций")).toHaveValue("");
});

test("фильтры движений видны всегда, выбираются и очищаются",async({page})=>{
 await page.goto("/products?tab=movements&status=%D0%9F%D1%80%D0%BE%D0%B2%D0%B5%D0%B4%D0%B5%D0%BD");
 await expect(page.getByRole("button",{name:"Очистить фильтры и сортировку"})).toBeVisible();
 await page.getByRole("button",{name:"Все операции"}).click();
 await page.getByRole("option",{name:"Перемещение"}).click();
 await expect.poll(()=>new URL(page.url()).searchParams.get("operation")).toBe("Перемещение");
 await page.getByRole("button",{name:"Очистить фильтры и сортировку"}).click();
 await expect.poll(()=>new URL(page.url()).searchParams.has("status")).toBe(false);
 await expect(page.getByRole("button",{name:"Очистить фильтры и сортировку"})).toBeVisible();
});

test("партия открывает историю движений товара",async({page})=>{
 await page.goto("/products?tab=batches");
 await page.getByRole("row").filter({hasText:"RTL-B-OLD"}).click();
 await expect(page.getByRole("tab",{name:"Движения"})).toHaveAttribute("aria-selected","true");
 await expect.poll(()=>new URL(page.url()).searchParams.get("batch")).toBe("RTL-B-OLD");
 await expect.poll(()=>new URL(page.url()).searchParams.get("sku")).toBe("RTL-1");
});

for(const width of [390,768,1280,1440]){
 for(const theme of ["light","dark"] as const){
  test(`движения с количеством ${width}px ${theme}`,async({page})=>{
   const browserErrors:string[]=[];
   page.on("pageerror",error=>browserErrors.push(error.message));
   await page.setViewportSize({width,height:900});
   await page.goto("/products?tab=movements");
   if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();
   await expect(page.getByRole("columnheader",{name:"Количество"})).toBeVisible();
   await expect(page.getByRole("row").filter({hasText:"STOCK-7"}).getByRole("cell",{name:"12"})).toBeVisible();
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
   expect(browserErrors).toEqual([]);
   if(width===390||width===1440)await page.screenshot({path:`test-results/movement-quantity-${width}-${theme}.png`,fullPage:true});
  });
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
