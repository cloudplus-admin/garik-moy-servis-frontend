import {expect,test} from "@playwright/test";

const json=(body:unknown,status=200)=>({status,contentType:"application/json",body:JSON.stringify(body)});

test.beforeEach(async({page})=>{
 await page.route("**/api/**",async route=>{
  const url=route.request().url();
  if(url.includes("/api/application-configuration"))return route.fulfill(json({pages:[{pageKey:"products",title:"Товары и операции",subtitle:"Учет товаров",sortOrder:1},{pageKey:"clients",title:"Контрагенты",subtitle:"Партнеры",sortOrder:2}],businesses:[{id:1,code:"import",name:"GARIK IMPORT",summary:"Импорт"},{id:2,code:"retail",name:"GARIK RETAIL",summary:"Розница"}],observers:[]}));
  if(url.includes("/api/pricelist/manufacturers"))return route.fulfill(json([{id:10,name:"Очень длинное название производителя автомобильных масел",type:"Производитель",businessCode:"import",businessName:"GARIK IMPORT"}]));
  if(url.includes("/api/pricelist"))return route.fulfill(json([]));
  if(url.includes("/api/clients/counterparty"))return route.fulfill(json({id:11,businessId:1,name:"NEW SUPPLIER",type:"Поставщик",creditLimit:"0",debt:"0",dueDate:"-",manager:"Не назначен"},201));
  if(url.includes("/api/clients"))return route.fulfill(json([{name:"TASHKENT AUTO PARTS",type:"Поставщик",creditLimit:"1000000",debt:"0",dueDate:"-",manager:"Азиз Каримов"}]));
  if(url.includes("/api/products"))return route.fulfill(json([{sku:"SKU-1",name:"Масло",brand:"Ravenol",package:"4 л",quantity:"12",reserved:"0",price:"100",retailPrice:"120",status:"В наличии"}]));
  return route.fulfill(json([]));
 });
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const){
 test(`производитель и новый контрагент ${width}px ${theme}`,async({page})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width,height:900});await page.goto("/products?tab=pricelist");
  if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();
  await page.getByRole("button",{name:"Добавить товар"}).click();
  await expect(page.getByText("Компания",{exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Производитель из контрагентов или другой"}).click();
  const menu=page.getByRole("listbox");await expect(menu).toBeVisible();await expect(menu.getByText("Другой - ввести вручную")).toBeVisible();
  const menuBox=await menu.boundingBox();expect(menuBox).not.toBeNull();expect(menuBox!.x).toBeGreaterThanOrEqual(0);expect(menuBox!.x+menuBox!.width).toBeLessThanOrEqual(width);
  if(width===390||width===1440)await page.screenshot({path:`test-results/manufacturer-${width}-${theme}.png`,fullPage:true});
  await menu.getByText("Другой - ввести вручную").click();await expect(page.getByLabel("Название другого производителя")).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
  if(width<=820)await page.getByRole("button",{name:"Открыть меню"}).click();
  await page.getByRole("button",{name:"Контрагенты"}).click();await page.getByRole("button",{name:"Новый контрагент"}).click();
  await expect(page.getByRole("dialog")).toBeVisible();await page.getByLabel("Название").fill("NEW SUPPLIER");
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
  if(width===390||width===1440)await page.screenshot({path:`test-results/counterparty-${width}-${theme}.png`,fullPage:true});
  await page.getByRole("button",{name:"Добавить контрагента"}).click();await expect(page.getByText("Контрагент добавлен в базу")).toBeVisible();
  expect(errors).toEqual([]);
 });
}
