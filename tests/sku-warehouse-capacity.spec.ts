import {expect,test} from "@playwright/test";

const json=(body:unknown,status=200)=>({status,contentType:"application/json",body:JSON.stringify(body)});

test.beforeEach(async({page})=>{
 await page.route("**/api/**",async route=>{
  const url=route.request().url();
  if(url.includes("/api/application-configuration"))return route.fulfill(json({pages:[{pageKey:"warehouses",title:"Склады",subtitle:"Остатки",sortOrder:1},{pageKey:"products",title:"Товары и операции",subtitle:"Учет товаров",sortOrder:2}],businesses:[{id:1,code:"import",name:"GARIK IMPORT",summary:"Импорт"}],observers:[]}));
  if(url.includes("/api/products/generate-sku"))return route.fulfill(json({sku:"GMS-A1B2C3D4E5"}));
  if(url.includes("/api/pricelist/manufacturers"))return route.fulfill(json([]));
  if(url.includes("/api/pricelist"))return route.fulfill(json([]));
  if(url.includes("/api/warehouse-stocks/valuation"))return route.fulfill(json([{id:1,warehouseName:"Главный склад",sku:"SKU-1",productName:"Масло",quantity:400,expectedIncoming:0,expectedOutgoing:0,remainingAfterOutgoing:400,purchasePrice:100, purchaseValue:40000,retailPrice:150,retailValue:60000}]));
  if(url.includes("/api/movements/search"))return route.fulfill(json([]));
  if(url.includes("/api/warehouses"))return route.fulfill(json([{name:"Главный склад",type:"Основной",quantity:"400",value:"40000",capacity:"40%",capacityTotal:1000,capacityUsed:400,warehouseNote:"Осталось места примерно на 3 партии среднего размера"}]));
  if(url.includes("/api/dashboard"))return route.fulfill(json({hero:[],kpi:[],products:[["SKU-1","Масло","Ravenol","4 л","400","0","100","150","В наличии","41"],["AF-209","Антифриз G12","Fuchs","5 л","80","0","200","250","В наличии","42"]],clients:[],movements:[],warehouses:[["Главный склад"],["Магазин"]],sales:[],debts:[],cash:[],staff:["Азиз Каримов · Руководитель"]}));
  if(url.includes("/api/products"))return route.fulfill(json([{id:41,sku:"SKU-1",name:"Масло",brand:"Ravenol",package:"4 л",quantity:"400",reserved:"0",price:"100",retailPrice:"150",status:"В наличии"}]));
  return route.fulfill(json([]));
 });
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const){
 test(`вместимость склада ${width}px ${theme}`,async({page})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width,height:900});await page.goto("/warehouses");
  if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();
  await expect(page.getByText("~400 / 1000 ед.")).toBeVisible();await page.getByRole("button",{name:/Главный склад/}).click();
  await expect(page.getByRole("dialog")).toContainText("Осталось места примерно на 3 партии среднего размера");
  await expect(page.getByRole("row",{name:/Итого/})).toContainText("400 ед.");await expect(page.getByRole("row",{name:/Итого/})).toContainText("Средняя: 100 сум");
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
  if(width===390||width===1440)await page.screenshot({path:`test-results/warehouse-capacity-${width}-${theme}.png`,fullPage:true});
  expect(errors).toEqual([]);
 });
}

test("сервер генерирует SKU в форме",async({page})=>{
 await page.goto("/products?tab=pricelist");await page.getByRole("button",{name:"Добавить товар"}).click();await page.getByRole("button",{name:"Сгенерировать SKU"}).click();await expect(page.getByLabel("Артикул / SKU")).toHaveValue("GMS-A1B2C3D4E5");
});

test("перевод отправляет выбранные товар, количество, склады, дату и ответственного",async({page})=>{
 let payload:Record<string,unknown>={};
 await page.route("**/api/movements/transfer",async route=>{payload=route.request().postDataJSON();await route.fulfill(json({id:77,status:"Проведен"},201))});
 await page.goto("/warehouses");await page.getByRole("button",{name:"Переместить товар"}).click();
 await page.getByLabel("Количество").fill("17");await page.getByRole("button",{name:"Создать перемещение"}).click();
 await expect(page.getByText("Перемещение создано, остатки обновлены")).toBeVisible();
 expect(payload).toMatchObject({businessId:1,source:"Главный склад",destination:"Магазин",productId:41,quantity:17,responsible:"Азиз Каримов"});expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const)test(`товар в переводе ищется по названию и SKU ${width}px ${theme}`,async({page})=>{
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));await page.setViewportSize({width,height:900});
 await page.goto("/warehouses");if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();await page.getByRole("button",{name:"Переместить товар"}).click();
 await page.getByRole("button",{name:"Товар",exact:true}).click();
 const search=page.getByLabel("Поиск: Товар");await search.fill("антифриз");
 await expect(page.getByRole("option",{name:/Антифриз G12.*SKU: AF-209/})).toBeVisible();
 await search.fill("AF-209");await page.getByRole("option",{name:/Антифриз G12.*SKU: AF-209/}).click();
 const product=page.getByRole("button",{name:"Товар",exact:true});await expect(product).toContainText("Антифриз G12");await expect(product).toContainText("SKU: AF-209");
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);expect(errors).toEqual([]);
 if(width===390||width===1440)await page.screenshot({path:`test-results/transfer-product-search-${width}-${theme}.png`,fullPage:true});
});
