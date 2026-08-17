import {DataTable} from "../shared";
import type {TabTableProps} from "./types";
export function SalesTab(props:TabTableProps&{onRowClick?:(row:string[])=>void}){
 return <DataTable {...props} onRowClick={props.onRowClick} headers={["Документ","Дата","Клиент","Магазин","Сумма","Оплата"]} columnClasses={["","","","","price-column","status-column"]}/>
}
