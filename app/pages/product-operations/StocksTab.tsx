import {DataTable} from "../shared";
import type {TabTableProps} from "./types";
export function StocksTab(props:TabTableProps&{onProductClick?:(row:string[])=>void}){return <DataTable {...props} onRowClick={props.onProductClick} hiddenColumns={[1,9]} headers={["Артикул","Товар","Бренд","Фасовка","Остаток","Факт","Цена","Розничная цена","Статус"]} columnClasses={["","product-column","","","number-column","number-column","price-column","price-column","status-column"]}/>}
