import {expect,test} from "@playwright/test";

const json=(body:unknown,status=200)=>({status,contentType:"application/json",body:JSON.stringify(body)});
const dashboard={hero:["ERP","1","2","3","4"],kpi:["1","2","3","4"],products:[],clients:[],movements:[],warehouses:[],sales:[],debts:[],cash:[],staff:[]};
const debts=[
 {customer:"SERGELI MOTORS",store:"Магазин Сергели",direction:"Покупатель",amount:"8 700 000",dueDate:"20.08.2026",manager:"Малика Хасанова",status:"Ожидается",kind:"receivable",comment:"Оплата по договору"},
 {customer:"Ravenol GmbH",store:"Центральный склад импорта",direction:"Производитель",amount:"38 400 000",dueDate:"25.08.2026",manager:"Азиз Каримов",status:"Ожидается",kind:"payable",comment:"Партия моторного масла"}
];

async function mockApi(page:import("@playwright/test").Page){
 await page.route("**/api/**",async route=>{
  const url=route.request().url();
  if(url.includes("/api/dashboard/"))return route.fulfill(json(dashboard));
  if(url.includes("/api/debts")&&route.request().method()==="GET")return route.fulfill(json(debts));
  if(url.endsWith("/api/debts")&&route.request().method()==="POST")return route.fulfill(json({id:20,...route.request().postDataJSON()},201));
  return route.fulfill(json([]));
 });
}

test("продавец добавляет долг производителю",async({page})=>{
 await mockApi(page);let roleHeader="";
 page.on("request",request=>{if(request.url().endsWith("/api/debts")&&request.method()==="POST")roleHeader=request.headers()["x-user-role"]??""});
 await page.goto("/");await page.getByRole("button",{name:"Войти как пользователь"}).click();await page.getByRole("button",{name:/Малика Хасанова/}).click();await page.getByRole("button",{name:"Долги и платежи"}).click();
 await expect(page.getByRole("heading",{name:"Нам должны"})).toBeVisible();await expect(page.getByRole("heading",{name:"Мы должны производителям"})).toBeVisible();await expect(page.getByText("Ravenol GmbH")).toBeVisible();
 await page.getByRole("button",{name:"Добавить долг"}).first().click();await page.getByRole("button",{name:"Добавить долг"}).last().click();await expect(page.getByRole("alert")).toContainText("Заполни контрагента");
 await page.getByRole("button",{name:"Тип долга"}).click();await page.getByRole("option",{name:"Мы должны производителю"}).click();await page.getByLabel("Производитель или поставщик").fill("Liqui Moly GmbH");await page.getByLabel("Сумма, сум").fill("24000000");await page.getByRole("button",{name:"Добавить долг"}).last().click();
 await expect(page.getByText("Долг производителю добавлен")).toBeVisible();expect(roleHeader).toBe("Продавец");
});

test("поиск задолженностей работает только по имени",async({page})=>{
 await mockApi(page);await page.goto("/");
 await expect(page.getByPlaceholder("Поиск товара, клиента или документа...")).toHaveCount(0);
 await page.getByRole("button",{name:"Долги и платежи"}).click();
 const search=page.getByLabel("Поиск по имени клиента или производителя");
 await search.fill("Ravenol");await expect(page.getByText("Ravenol GmbH")).toBeVisible();await expect(page.getByText("SERGELI MOTORS")).toHaveCount(0);
 await search.fill("неизвестный");await expect(page.getByText("По этому имени ничего не найдено")).toHaveCount(2);
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const)test(`долги ${width}px ${theme}`,async({page})=>{
 await mockApi(page);await page.setViewportSize({width,height:900});await page.goto("/");if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();if(width<=820)await page.getByRole("button",{name:"Открыть меню"}).click();await page.getByRole("button",{name:"Долги и платежи"}).click();
 const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));expect(metrics.scrollWidth).toBe(metrics.clientWidth);await expect(page.getByRole("button",{name:"Добавить долг"}).first()).toBeVisible();await page.screenshot({path:`screenshots/debts-${width}-${theme}.png`,fullPage:true});
});
