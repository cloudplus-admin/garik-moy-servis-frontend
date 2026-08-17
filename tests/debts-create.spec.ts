import {expect,test} from "@playwright/test";

const json=(body:unknown,status=200)=>({status,contentType:"application/json",body:JSON.stringify(body)});
const dashboard={hero:["ERP","1","2","3","4"],kpi:["1","2","3","4"],products:[],clients:[["Liqui Moly GmbH","Поставщик","0","0","","Малика Хасанова"]],movements:[],warehouses:[["Магазин Сергели"]],sales:[],debts:[],cash:[],staff:["Малика Хасанова · Продавец"]};
const configuration={pages:[{pageKey:"dashboard",title:"Обзор бизнеса",subtitle:"Показатели",sortOrder:1},{pageKey:"debts",title:"Кредит и дебит",subtitle:"Расчеты",sortOrder:2}],businesses:[{id:1,code:"import",name:"GARIK IMPORT",summary:"Импорт"},{id:2,code:"retail",name:"GARIK RETAIL",summary:"Розница"}],observers:[{name:"Малика Хасанова",title:"Продавец",role:"Продавец",company:"retail"}]};
const debts=[
 {customer:"SERGELI MOTORS",store:"Магазин Сергели",direction:"Покупатель",amount:"8 700 000",dueDate:"20.08.2026",manager:"Малика Хасанова",status:"Ожидается",kind:"receivable",comment:"Оплата по договору"},
 {customer:"Ravenol GmbH",store:"Центральный склад импорта",direction:"Производитель",amount:"38 400 000",dueDate:"25.08.2026",manager:"Азиз Каримов",status:"Ожидается",kind:"payable",comment:"Партия моторного масла"}
];

async function mockApi(page:import("@playwright/test").Page){
 await page.route("**/api/**",async route=>{
  const url=route.request().url();
  if(url.includes("/api/application-configuration"))return route.fulfill(json(configuration));
  if(url.includes("/api/dashboard/"))return route.fulfill(json(dashboard));
  if(url.includes("/api/debts")&&route.request().method()==="GET")return route.fulfill(json(debts));
  if(url.endsWith("/api/debts")&&route.request().method()==="POST")return route.fulfill(json({id:20,...route.request().postDataJSON()},201));
  return route.fulfill(json([]));
 });
}

test("руководитель добавляет кредит без Unicode в HTTP-заголовке",async({page})=>{
 await mockApi(page);let roleHeader="";
 page.on("request",request=>{if(request.url().endsWith("/api/debts")&&request.method()==="POST")roleHeader=request.headers()["x-user-role"]??""});
 await page.goto("/debts");
 await expect(page.getByRole("heading",{name:"Дебит",exact:true})).toBeVisible();await expect(page.getByRole("heading",{name:"Кредит",exact:true})).toBeVisible();await expect(page.getByText("Ravenol GmbH")).toBeVisible();
 await page.getByRole("button",{name:"Добавить кредит"}).first().click();await expect(page.getByRole("heading",{name:"Добавить кредит"})).toBeVisible();await page.getByRole("button",{name:"Добавить кредит"}).last().click();await expect(page.locator(".form-error")).toContainText("Заполни контрагента");
 await expect(page.getByRole("button",{name:"Тип долга",exact:true})).toContainText("Мы должны производителю");await expect(page.getByRole("button",{name:"Контрагент",exact:true})).toContainText("Liqui Moly GmbH");await page.getByLabel("Сумма, сум").fill("24000000");await page.getByRole("button",{name:"Добавить кредит"}).last().click();
 await expect(page.getByText("Кредит добавлен")).toBeVisible();expect(roleHeader).toBe(encodeURIComponent("Руководитель"));expect([...roleHeader].every(character=>character.charCodeAt(0)<=255)).toBe(true);
});

test("поиск задолженностей работает только по имени",async({page})=>{
 await mockApi(page);await page.goto("/debts");
 await expect(page.getByPlaceholder("Поиск товара, клиента или документа...")).toHaveCount(0);
 const search=page.getByLabel("Поиск по контрагенту");
 await search.fill("Ravenol");await expect(page.getByText("Ravenol GmbH")).toBeVisible();await expect(page.getByText("SERGELI MOTORS")).toHaveCount(0);
 await search.fill("неизвестный");await expect(page.getByText("По этому имени ничего не найдено")).toHaveCount(2);
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const)test(`долги ${width}px ${theme}`,async({page})=>{
 await mockApi(page);await page.setViewportSize({width,height:900});await page.goto("/debts");if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();
 await page.waitForTimeout(500);const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));expect(metrics.scrollWidth).toBe(metrics.clientWidth);await expect(page.getByRole("button",{name:"Добавить кредит"}).first()).toBeVisible();await expect(page.getByRole("button",{name:"Добавить дебит"}).first()).toBeVisible();await expect(page.getByRole("button",{name:"Внести оплату"})).toBeVisible();await page.screenshot({path:`screenshots/debts-${width}-${theme}.png`,fullPage:true});
});
