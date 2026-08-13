import {expect,test} from "@playwright/test";

test("разделы загружают только свой API и используют кеш при возврате",async({page})=>{
  const calls:string[]=[];
  page.on("request",request=>{const url=new URL(request.url());if(url.pathname.startsWith("/api/"))calls.push(`${url.pathname}${url.search}`)});
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Обзор бизнеса"})).toBeVisible();
  await expect.poll(()=>calls.filter(x=>x.startsWith("/api/dashboard/")).length).toBe(1);
  expect(calls.filter(x=>!x.startsWith("/api/dashboard/"))).toEqual([]);

  await page.getByRole("button",{name:/Товары и остатки/}).click();
  await expect(page.getByRole("heading",{name:"Товары и остатки"})).toBeVisible();
  await expect.poll(()=>calls.filter(x=>x.startsWith("/api/products?scope=all")).length).toBe(1);
  expect(calls.filter(x=>x.startsWith("/api/warehouses")||x.startsWith("/api/clients"))).toEqual([]);

  await page.getByRole("button",{name:/Склады/}).click();
  await expect.poll(()=>calls.filter(x=>x.startsWith("/api/warehouses?scope=all")).length).toBe(1);
  await page.getByRole("button",{name:/Товары и остатки/}).click();
  await expect(page.getByText(/позиций показано/)).toBeVisible();
  expect(calls.filter(x=>x.startsWith("/api/products?scope=all"))).toHaveLength(1);
});

test("быстрый переход из табличного раздела в сотрудников не роняет страницу",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Обзор бизнеса"})).toBeVisible();
  await page.getByRole("button",{name:/Склады/}).click();
  await expect(page.getByText(/складских точек/)).toBeVisible();
  await page.getByRole("button",{name:/Сотрудники/}).click();
  await expect(page.getByText(/сотрудников в доступном контуре/)).toBeVisible();
  expect(errors).toEqual([]);
});
