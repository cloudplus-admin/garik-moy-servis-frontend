import { expect, test } from "@playwright/test";

test("записывающие действия фронтенда используют ERP API", async ({ page }) => {
  const failures:string[]=[];
  page.on("response",response=>{if(response.url().includes("/api/")&&response.status()>=400)failures.push(`${response.status()} ${response.url()}`)});
  await page.goto("/");
  await page.getByRole("button",{name:"Продажи"}).click();
  await page.getByRole("button",{name:"Новая продажа"}).click();
  await page.getByRole("button",{name:"Провести продажу"}).click();
  await expect(page.getByText("Продажа проведена и сохранена на сервере")).toBeVisible();
  await page.getByRole("button",{name:"Отчеты"}).click();
  await page.getByLabel("Сформировать отчет Остатки на дату").click();
  await expect(page.getByText(/Отчет «Остатки на дату».*сформирован/)).toBeVisible();
  expect(failures).toEqual([]);
});
