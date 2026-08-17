import {expect,test} from "@playwright/test";

const viewports=[390,768,1280,1440] as const;
const themes=["light","dark"] as const;

for(const width of viewports)for(const theme of themes)test(`cash and employees ${width} ${theme}`,async({page})=>{
 const errors:string[]=[];page.on("console",message=>message.type()==="error"&&errors.push(message.text()));page.on("pageerror",error=>errors.push(error.message));
 await page.setViewportSize({width,height:900});
 await page.addInitScript(({theme})=>{localStorage.setItem("garik-theme:Алишер Юсупов",theme)}, {theme});
 await page.goto("/finance");await expect(page.getByRole("heading",{name:"Деньги под контролем"})).toBeVisible();
 await expect(page.getByLabel("Поиск товара по названию или SKU")).toBeVisible();
 await page.getByLabel("Поиск товара по названию или SKU").fill("RTL-RAV-530");
 await expect(page.getByText("Ravenol VMP 5W-30").first()).toBeVisible();
 await page.getByText("RTL-RAV-530").first().click();await expect(page.getByRole("dialog")).toContainText("Маржа");await page.keyboard.press("Escape");
 await page.getByRole("button",{name:"Внести средства"}).click();await expect(page.getByRole("dialog")).toContainText("Остальное");await page.getByRole("button",{name:"Внести",exact:true}).click();await expect(page.getByText("Выбери кассу, укажи сумму и назначение",{exact:true})).toBeVisible();await page.keyboard.press("Escape");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
 await page.goto("/employees");await expect(page.getByText("Бекзод Рахимов")).toBeVisible();await page.getByText("Бекзод Рахимов").click();const dialog=page.getByRole("dialog");await expect(dialog).toContainText("Дата оформления");await expect(dialog).toContainText("8 000 000 сум");
 expect(await dialog.evaluate(element=>getComputedStyle(element).backgroundColor)).not.toMatch(/transparent|rgba\([^)]*,\s*0\)/);
 const box=await dialog.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);expect(box!.y+box!.height).toBeLessThanOrEqual(900);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
 if(width===390||width===1440)await page.screenshot({path:`screenshots/cash-employees-${width}-${theme}.png`,fullPage:true});
 expect(errors).toEqual([]);
});

test("sale redirects to cash details",async({page})=>{
 await page.goto("/products?tab=sales");await expect(page.getByRole("tab",{name:"Продажи"})).toHaveAttribute("aria-selected","true");
 await page.getByText("RTL-01430").click();await expect(page).toHaveURL(/\/finance\?sale=RTL-01430/);await expect(page.getByRole("dialog")).toContainText("Продажа RTL-01430");
});

test("cash operation persists and changes balance",async({page,request})=>{
 const purpose=`Возврат подотчетных средств QA ${Date.now()}`;await page.goto("/finance");await page.getByRole("button",{name:"Внести средства"}).click();const dialog=page.getByRole("dialog");await dialog.getByLabel("Сумма, сум").fill("125000");await dialog.getByLabel("Назначение").fill(purpose);await dialog.getByRole("button",{name:"Внести",exact:true}).click();await expect(dialog).toBeHidden();await expect(page.getByText(purpose,{exact:true})).toBeVisible();
 const overview=await request.get("http://127.0.0.1:48181/api/finance/overview?scope=all&period=month");expect(overview.ok()).toBe(true);expect((await overview.json()).transactions.some((item:{purpose:string})=>item.purpose===purpose)).toBe(true);
});
