export type TabTableProps={rows:string[][];sortIndex:number|null;sortDirection:"asc"|"desc";onSort:(index:number)=>void;onRowClick?:(row:string[])=>void};
