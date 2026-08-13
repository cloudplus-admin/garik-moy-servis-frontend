import { expect, test } from "@playwright/test";

const viewports = [{width:390,height:844},{width:768,height:900},{width:1280,height:900},{width:1440,height:1000}];

for (const viewport of viewports) {
  for (const theme of ["light","dark"] as const) {
    test(`${viewport.width}px ${theme}: карточки обзора открывают подробные разделы`, async ({page}) => {
      await page.setViewportSize(viewport);
      const errors:string[]=[];
      page.on("console",message=>{if(message.type()==="error")errors.push(message.text())});
      page.on("pageerror",error=>errors.push(error.message));
      await page.goto("/");
      if(theme==="dark")await page.getByLabel("Включить темную тему").click();
      await expect(page.getByRole("heading",{name:"Обзор бизнеса"})).toBeVisible();

      await page.getByRole("button",{name:/Выручка за июль - открыть подробный отчет/}).click();
      await expect(page.getByRole("heading",{name:"Продажи"})).toBeVisible();
      if(viewport.width<=820)await page.getByLabel("Открыть меню").click();
      await page.getByRole("button",{name:"Обзор бизнеса"}).click();
      await page.getByRole("button",{name:/Дебиторская задолженность - открыть подробный отчет/}).click();
      await expect(page.getByRole("heading",{name:"Долги и платежи"})).toBeVisible();

      if(viewport.width<=820)await page.getByLabel("Открыть меню").click();
      await page.getByRole("button",{name:"Обзор бизнеса"}).click();
      await page.waitForTimeout(550);
      if ([390,1440].includes(viewport.width)) await page.screenshot({path:`screenshots/dashboard-clickable-${viewport.width}-${theme}.png`,fullPage:true,animations:"disabled"});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
      expect(errors).toEqual([]);
    });
  }
}
