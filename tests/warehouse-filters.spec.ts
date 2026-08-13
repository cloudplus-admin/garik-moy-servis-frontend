import {expect,test} from "@playwright/test";

test("склад открывает окно остатков, товары фильтруются",async({page})=>{
 await page.route("**/api/warehouse-stocks?scope=all",route=>route.fulfill({json:[{id:1,warehouseName:"Центральный склад импорта",sku:"IMP-RAV-530",productName:"Ravenol VMP 5W-30",quantity:300,expectedIncoming:80,expectedOutgoing:24}]}));
 await page.goto("/");
 await page.getByRole("button",{name:/Склады/}).click();
 await page.getByRole("button",{name:/Центральный склад импорта/}).click();
 await expect(page.getByRole("dialog")).toContainText("Ravenol VMP 5W-30");
 await page.getByRole("button",{name:"Закрыть склад"}).click();
 await page.getByRole("button",{name:/Товары и остатки/}).click();
 await page.getByLabel("Фильтр товаров").fill("Liqui Moly");
 await expect(page.getByRole("row",{name:/Liqui Moly/})).toHaveCount(2);
 await expect(page.getByRole("row",{name:/Ravenol/})).toHaveCount(0);
});

test("форма перемещения показывает все склады выбранного бизнеса",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Склады/}).click();
 await page.getByRole("button",{name:/Переместить товар/}).click();
 await page.getByRole("button",{name:"Склад-отправитель"}).click();
 await expect(page.getByRole("option")).toHaveCount(3);
});
