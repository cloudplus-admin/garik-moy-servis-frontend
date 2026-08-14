import {DataTable} from "../shared";
import type {TabTableProps} from "./types";
export function StocksTab(props:TabTableProps&{onProductClick?:(row:string[])=>void}){return <DataTable {...props} onRowClick={props.onProductClick} headers={["Артикул","Товар","Бренд","Фасовка","Факт","Резерв","Цена","Розничная цена","Статус"]} columnClasses={["","product-column","","","number-column","number-column","price-column","price-column","status-column"]}/>}
