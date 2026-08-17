import {expect,test} from "@playwright/test";

const json=(body:unknown,status=200)=>({status,contentType:"application/json",body:JSON.stringify(body)});
const debts=[{id:7,businessId:1,customer:"SERGELI MOTORS",store:"Главный склад",direction:"Покупатель",amount:"1 000",dueDate:"20.08.2026",manager:"Азиз Каримов",status:"Ожидается",kind:"receivable",comment:""}];

test.beforeEach(async({page})=>{
 await page.route("**/api/**",async route=>{
  const url=route.request().url(),method=route.request().method();
  if(url.includes("/api/application-configuration"))return route.fulfill(json({pages:[{pageKey:"debts",title:"Кредит и дебит",subtitle:"Расчеты",sortOrder:1}],businesses:[{id:1,code:"import",name:"GARIK IMPORT",summary:"Импорт"}],observers:[]}));
  if(url.includes("/api/debts/payment")&&method==="POST")return route.fulfill(json({debtId:7,amount:"0",status:"Закрыт",advance:500}));
  if(url.includes("/api/debts/history")&&method==="GET")return route.fulfill(json([{type:"purchase",amount:"1 000",occurredAt:"20.08.2026",document:"Долг #7",note:"Ожидается",product:""}]));
  if(url.includes("/api/debts")&&method==="GET")return route.fulfill(json(debts));
  if(url.includes("/api/dashboard"))return route.fulfill(json({hero:[],kpi:[],products:[],clients:[["SERGELI MOTORS","Покупатель","0","1000","20.08.2026","Азиз Каримов"]],movements:[],warehouses:[["Главный склад"]],sales:[],debts:[],cash:[],staff:["Азиз Каримов · Руководитель"]}));
  return route.fulfill(json([]));
 });
});

test("переплата превращается в аванс покупателя",async({page})=>{
 let payload:Record<string,unknown>={};
 await page.route("**/api/debts/payment",async route=>{payload=route.request().postDataJSON();await route.fulfill(json({debtId:7,amount:"0",status:"Закрыт",advance:500}))});
 await page.goto("/debts");await page.getByRole("button",{name:"Внести оплату"}).click();const amount=page.getByLabel("Сумма оплаты, сум");await amount.clear();await amount.fill("1500");await page.getByRole("button",{name:"Сохранить оплату"}).click();
 await expect(page.getByText("Долг закрыт. Аванс покупателя: 500 сум")).toBeVisible();expect(payload).toMatchObject({debtId:7,amount:"1500"});
});

test("история открывается для конкретного долга",async({page})=>{
 let historyUrl="";page.on("request",request=>{if(request.url().includes("/api/debts/history"))historyUrl=request.url()});
 await page.goto("/debts");await page.getByRole("button",{name:/SERGELI MOTORS/}).click();
 await expect(page.getByRole("dialog",{name:"История SERGELI MOTORS"})).toContainText("1 000 сум");
 expect(historyUrl).toContain("debtId=7");expect(historyUrl).not.toContain("counterparty=");
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const)test(`оплата ${width}px ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto("/debts");if(theme==="dark")await page.getByRole("button",{name:"Включить темную тему"}).click();await page.getByRole("button",{name:"Внести оплату"}).click();
 await expect(page.getByRole("dialog")).toBeVisible();await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
 if(width===390||width===1440)await page.screenshot({path:`test-results/debt-advance-${width}-${theme}.png`,fullPage:true});
});
