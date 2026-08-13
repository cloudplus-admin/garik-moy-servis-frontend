import {DataTable} from "../shared";
import type {TabTableProps} from "./types";
export function BatchesTab(props:TabTableProps){return <DataTable {...props} headers={["ID партии","Артикул","Товар","Прибытие","Поставщик","Склад","Принято","Доступно"]}/>}
