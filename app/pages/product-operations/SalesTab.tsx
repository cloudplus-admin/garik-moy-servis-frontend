import {DataTable} from "../shared";
import type {TabTableProps} from "./types";
export function SalesTab(props:TabTableProps){
 return <DataTable {...props} headers={["Документ","Дата","Клиент","Магазин","Сумма","Оплата"]} columnClasses={["","","","","price-column","status-column"]}/>
}
