import {expect,test} from "@playwright/test";

test("sorting dropdown stays above the data table",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"Товары"}).click();
  await page.getByRole("button",{name:"Сортировать товары"}).click();

  const menu=page.getByRole("listbox");
  await expect(menu).toBeVisible();
  const isTopLayer=await menu.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    const topElement=document.elementFromPoint(rect.left+rect.width/2,rect.top+Math.min(rect.height/2,24));
    return topElement===element||element.contains(topElement);
  });
  expect(isTopLayer).toBe(true);
});
