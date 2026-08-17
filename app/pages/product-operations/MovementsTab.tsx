import {DataTable} from "../shared";
import type {TabTableProps} from "./types";
export function MovementsTab(props:TabTableProps){return <DataTable {...props} hiddenColumns={[1]} headers={["Документ","Товар","Артикул / SKU","Операция","Откуда / поставщик","Куда / клиент","Количество","Дата","Статус"]} columnClasses={["","product-column","","","","","number-column","",""]}/>}
