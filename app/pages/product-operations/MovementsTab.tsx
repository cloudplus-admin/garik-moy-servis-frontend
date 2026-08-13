import {DataTable} from "../shared";
import type {TabTableProps} from "./types";
export function MovementsTab(props:TabTableProps){return <DataTable {...props} headers={["Документ","Операция","Откуда / поставщик","Куда / клиент","Дата","Статус"]}/>}
