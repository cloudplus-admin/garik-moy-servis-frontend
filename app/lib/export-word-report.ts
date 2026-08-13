import type {Company,Page} from "./types";

const pageNames:Record<Page,string>={dashboard:"Обзор бизнеса",warehouses:"Складская сеть",products:"Товары и операции",movements:"Движение товара",sales:"Продажи",clients:"Клиенты",debts:"Долги и платежи",finance:"Управленческий учет",employees:"Сотрудники",reports:"Отчеты"};
const companyNames:Record<Company,string>={all:"Все компании",import:"GARIK IMPORT",retail:"GARIK RETAIL"};

export async function exportWordReport(page:Page,company:Company,rows:string[]|string[][]){
 const {Document,Packer,Paragraph,Table,TableCell,TableRow,TextRun,WidthType}=await import("docx");
 const matrix=rows.map(row=>Array.isArray(row)?row:[row]);
 const columnCount=Math.max(1,...matrix.map(row=>row.length));
 const normalized=matrix.map(row=>Array.from({length:columnCount},(_,index)=>String(row[index]??"-")));
 const wordDocument=new Document({sections:[{children:[
  new Paragraph({children:[new TextRun({text:`Отчет: ${pageNames[page]}`,bold:true,size:32})]}),
  new Paragraph({text:`Контур: ${companyNames[company]}`}),
  new Paragraph({text:`Сформирован: ${new Date().toLocaleString("ru-RU")}`}),
  new Paragraph({text:`Количество записей: ${matrix.length}`}),
  ...(normalized.length?[new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:normalized.map(row=>new TableRow({children:row.map(value=>new TableCell({children:[new Paragraph(value)]}))}))})]:[new Paragraph({text:"В выбранном разделе нет данных."})])
 ]}]});
 const blob=await Packer.toBlob(wordDocument);
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");
 link.href=url;link.download=`garik-${page}-${new Date().toISOString().slice(0,10)}.docx`;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
