import { expect, test } from "@playwright/test";

const viewports = [{width:390,height:844},{width:768,height:900},{width:1280,height:900},{width:1440,height:1000}];

for (const viewport of viewports) {
  for (const theme of ["light","dark"] as const) {
    test(`${viewport.width}px ${theme}: контуры и роли`, async ({page}) => {
      await page.setViewportSize(viewport);
      const errors:string[]=[];
      page.on("console",message=>{if(message.type()==="error")errors.push(message.text())});
      await page.goto("/");
      if(theme==="dark")await page.getByLabel("Включить темную тему").click();

      const company=page.getByLabel("Выбрать бизнес");
      await company.click();
      await page.getByRole("option",{name:"GARIK IMPORT"}).click();
      await expect(page.getByTestId("business-context")).toContainText("GARIK IMPORT");
      await expect(page.getByText("2,42 млрд сум").first()).toBeVisible();

      await company.click();
      await page.getByRole("option",{name:"GARIK RETAIL"}).click();
      await expect(page.getByTestId("business-context")).toContainText("GARIK RETAIL");
      await expect(page.getByText("846 млн сум").first()).toBeVisible();

      await company.click();
      await page.getByRole("option",{name:"Все компании"}).click();
      await expect(page.getByTestId("business-context")).toContainText("Консолидированные данные двух бизнесов");
      await page.getByRole("button",{name:/Войти как пользователь/}).click();
      await page.getByRole("button",{name:/Малика Хасанова/}).click();
      await expect(page.getByText(/ты смотришь систему глазами пользователя/i)).toContainText("Малика Хасанова");
      await expect(page.getByRole("button",{name:"Управленческий учет"})).toHaveCount(0);
      await expect(page.getByLabel("Выбрать бизнес")).toBeDisabled();

      if ([390,1440].includes(viewport.width)) {
        if (viewport.width===390) await page.getByLabel("Открыть меню").click();
        await page.getByRole("button",{name:"Продажи"}).click();
        await page.getByRole("button",{name:"Новая продажа"}).click();
        const modal=page.getByRole("heading",{name:"Новая продажа"}).locator("..",{has:page.getByText("GARIK RETAIL",{exact:true})}).locator("..");
        await expect(page.getByRole("heading",{name:"Новая продажа"})).toBeVisible();
        const background=await page.locator(".modal").evaluate(element=>getComputedStyle(element).backgroundColor);
        expect(background).not.toMatch(/rgba?\([^)]*,\s*0\s*\)$/);
        await page.getByLabel("Клиент").click();
        await expect(page.getByRole("option",{name:"SERGELI MOTORS"})).toBeVisible();
        await page.screenshot({path:`screenshots/${viewport.width}-${theme}-modal-select.png`,fullPage:true});
        await page.keyboard.press("Escape");
        await page.getByRole("button",{name:"Закрыть окно"}).click();
        await expect(modal).toHaveCount(0);
      }

      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow).toBe(0);
      expect(errors).toEqual([]);
      await page.screenshot({path:`screenshots/${viewport.width}-${theme}.png`,fullPage:true});
    });
  }
}
