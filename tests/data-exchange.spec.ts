import path from "node:path";
import { expect, test } from "@playwright/test";

const fixture=path.join(process.cwd(),"tests/fixtures/products-import.xlsx");

test("предпросмотр и импорт Excel работают через интерфейс",async({page})=>{
 const failures:string[]=[];const consoleErrors:string[]=[];
 page.on("response",response=>{if(response.url().includes("/api/")&&response.status()>=400)failures.push(`${response.status()} ${response.url()}`)});
 page.on("console",message=>{if(message.type()==="error")consoleErrors.push(message.text())});
 await page.goto("/");
 await page.getByRole("button",{name:"Импорт и экспорт"}).click();
 await expect(page.getByRole("dialog",{name:"Импорт и экспорт данных"})).toBeVisible();
 await expect(page.getByRole("complementary",{name:"Как подготовить Excel-файл"})).toContainText("Артикул");
 await expect(page.getByRole("link",{name:"Скачать Excel .xlsx"})).toHaveAttribute("href",/export\/products\.xlsx/);
 await page.locator('input[type="file"]').setInputFiles(fixture);
 await page.getByRole("button",{name:"Предпросмотр"}).click();
 await expect(page.getByText("1 строк найдено")).toBeVisible();
 await expect(page.getByText("Проверка пройдена")).toBeVisible();
 await page.getByRole("button",{name:"Импортировать данные"}).click();
 await expect(page.getByText("Загружено строк: 1")).toBeVisible();
 expect(failures).toEqual([]);expect(consoleErrors).toEqual([]);
});

for(const width of [390,768,1280,1440])for(const theme of ["light","dark"] as const)test(`окно обмена ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto("/");
 if(theme==="dark")await page.getByLabel("Включить темную тему").click();
 await page.getByRole("button",{name:"Импорт и экспорт"}).click();
 const dialog=page.getByRole("dialog",{name:"Импорт и экспорт данных"});await expect(dialog).toBeVisible();
 await page.locator('input[type="file"]').setInputFiles(fixture);await page.getByRole("button",{name:"Предпросмотр"}).click();await expect(page.getByText("Проверка пройдена")).toBeVisible();
 const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,bodyOverflow:getComputedStyle(document.body).overflow,background:getComputedStyle(document.querySelector('[role="dialog"]')!).backgroundColor,rect:(()=>{const r=document.querySelector('[role="dialog"]')!.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,bottom:r.bottom}})()}));
 expect(metrics.scrollWidth).toBe(metrics.clientWidth);expect(metrics.bodyOverflow).toBe("hidden");expect(metrics.background).not.toMatch(/rgba\([^)]*,\s*0\)|transparent/);expect(metrics.rect.top).toBeGreaterThanOrEqual(0);expect(metrics.rect.left).toBeGreaterThanOrEqual(0);expect(metrics.rect.right).toBeLessThanOrEqual(width);expect(metrics.rect.bottom).toBeLessThanOrEqual(900);
 await page.screenshot({path:`screenshots/exchange-${width}-${theme}.png`,fullPage:true});
});
