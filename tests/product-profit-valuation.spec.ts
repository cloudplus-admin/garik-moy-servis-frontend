import {expect,test} from "@playwright/test";

const json=(body:unknown)=>({status:200,contentType:"application/json",body:JSON.stringify(body)});

test.beforeEach(async({page})=>{
 await page.route("**/api/**",async route=>{
  const url=route.request().url();
  if(url.includes("/api/application-configuration"))return route.fulfill(json({pages:[{pageKey:"products",title:"Товары и операции",subtitle:"Учет товаров",sortOrder:1},{pageKey:"finance",title:"Касса",subtitle:"Финансы",sortOrder:2}],businesses:[{id:1,code:"import",name:"GARIK IMPORT",summary:"Импорт"}],observers:[]}));
  if(url.includes("/api/dashboard/"))return route.fulfill(json({hero:["ERP","1","2","3","4"],kpi:["1","2","3","4"],products:[["IMP-LM-540","Liqui Moly 5W-40","Liqui Moly","4 л","497","445","100 000","150 000","В наличии","1"]],clients:[],movements:[],warehouses:[],sales:[["SALE-1"]],debts:[],cash:[["Основная касса"]],staff:[]}));
  if(url.includes("/api/warehouse-stocks/valuation"))return route.fulfill(json([{id:1,sku:"IMP-LM-540",productName:"Liqui Moly 5W-40",warehouseName:"Главный склад",quantity:10,expectedIncoming:2,expectedOutgoing:3,remainingAfterOutgoing:7,purchasePrice:100000,purchaseValue:1000000,retailPrice:150000,retailValue:1500000}]));
  if(url.includes("/api/warehouse-stocks/product-trace"))return route.fulfill(json({stocks:[{id:1,warehouseName:"Резерв импорта",sku:"IMP-LM-540",productName:"Liqui Moly 5W-40",quantity:11,expectedIncoming:0,expectedOutgoing:0,projectedQuantity:11},{id:2,warehouseName:"Таможенный склад",sku:"IMP-LM-540",productName:"Liqui Moly 5W-40",quantity:22,expectedIncoming:0,expectedOutgoing:0,projectedQuantity:22},{id:3,warehouseName:"Центральный склад импорта",sku:"IMP-LM-540",productName:"Liqui Moly 5W-40",quantity:412,expectedIncoming:103,expectedOutgoing:51,projectedQuantity:464}],incoming:[{id:10,number:"IN-1",batchNumber:"IMP-B-2026-0001",source:"Liqui Moly GmbH",destination:"Центральный склад импорта",date:"18.08.2026",quantity:103,status:"Запланирован"}],outgoing:[{id:11,number:"OUT-1",batchNumber:"IMP-B-2026-0001",source:"Центральный склад импорта",destination:"Оптовый клиент",date:"2026-08-15",quantity:51,status:"Запланирован"}],totals:{quantity:445,expectedIncoming:103,expectedOutgoing:51,projectedQuantity:497}}));
  if(url.includes("/api/sales/SALE-1/details"))return route.fulfill(json({number:"SALE-1",date:"14.08.2026",customer:"Клиент",store:"Магазин",amount:300000,paymentStatus:"Оплачено",lines:[{sku:"IMP-LM-540",name:"Liqui Moly 5W-40",quantity:2,revenue:300000,cost:200000,profit:100000,margin:33.3,markup:50}]}));
  if(url.includes("/api/sales"))return route.fulfill(json([{number:"SALE-1",date:"14.08.2026",customer:"Клиент",store:"Магазин",warehouse:"Главный склад",amount:"300 000",paymentStatus:"Оплачено"}]));
  if(url.includes("/api/finance/overview"))return route.fulfill(json({available:1000000,payroll:0,supplierDebt:0,clientDebt:0,forecast:1000000,accounts:[],payrollItems:[],sales:[],products:[{sku:"IMP-LM-540",name:"Liqui Moly 5W-40",units:2,revenue:300000,cost:200000,grossProfit:100000,margin:33.3,markup:50}]}));
  if(url.includes("/api/finance"))return route.fulfill(json([{name:"Основная касса",owner:"GARIK IMPORT",balance:"1 000 000",updatedAt:"сейчас"}]));
  if(url.includes("/api/products"))return route.fulfill(json([{id:1,sku:"IMP-LM-540",name:"Liqui Moly 5W-40",brand:"Liqui Moly",package:"4 л",quantity:"497",reserved:"445",price:"100 000",retailPrice:"150 000",status:"В наличии"}]));
  if(url.includes("/api/pricelist"))return route.fulfill(json([]));
  return route.fulfill(json([]));
 });
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const)test(`актуальная карточка остатков ${width}px ${theme}`,async({page})=>{
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 await page.setViewportSize({width,height:900});await page.goto("/products?tab=stocks");
 await expect(page.getByRole("columnheader",{name:"Остаток"})).toBeVisible();
 await expect(page.getByRole("columnheader",{name:"Факт"})).toBeVisible();
 const productRow=page.getByRole("row").filter({hasText:"IMP-LM-540"});
 await expect(productRow).toContainText("497");await expect(productRow).toContainText("445");
 if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();
 await productRow.click();
 const dialog=page.getByRole("dialog");
 await expect(dialog.getByRole("row",{name:/Итого/})).toContainText("445 ед.");
 await expect(dialog.getByRole("row",{name:/Итого/})).toContainText("497 ед.");
 await expect(dialog).toContainText("103 ед.");await expect(dialog).toContainText("51 ед.");await expect(dialog).not.toContainText("Invalid Date");
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
 const box=await dialog.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
 expect(errors).toEqual([]);
 if(width===390||width===1440)await page.screenshot({path:`test-results/product-trace-${width}-${theme}.png`,fullPage:true});
});

test("складская оценка и детализация продажи показывают цены и прибыль",async({page})=>{
 await page.goto("/products?tab=warehouses");
 const stock=page.getByRole("row").filter({hasText:"IMP-LM-540"});
 await expect(stock).toContainText("Liqui Moly 5W-40");
 await expect(stock).toContainText("100 000 сум");
 await expect(stock).toContainText("1 500 000 сум");
 await page.getByRole("tab",{name:"Продажи"}).click();
 await page.getByRole("row").filter({hasText:"SALE-1"}).click();
 const dialog=page.getByRole("dialog");
 await expect(dialog).toContainText("100 000 сум");
 await expect(dialog).toContainText("33.3%");
 await expect(dialog).toContainText("50%");
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const)test(`аналитика товара в кассе ${width}px ${theme}`,async({page})=>{
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 await page.setViewportSize({width,height:900});await page.goto("/finance");
 if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();
 const row=page.getByRole("row").filter({hasText:"IMP-LM-540"});
 await expect(row).toContainText("Liqui Moly 5W-40");await expect(row).toContainText("100 000 сум");await expect(row).toContainText("33.3%");await expect(row).toContainText("50%");
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
 expect(errors).toEqual([]);
 if(width===390||width===1440){await page.waitForTimeout(500);await page.screenshot({path:`test-results/product-profit-${width}-${theme}.png`,fullPage:true});}
});
