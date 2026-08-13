export type Page = "dashboard"|"warehouses"|"products"|"movements"|"sales"|"clients"|"debts"|"finance"|"employees"|"reports";
export type Company = "all"|"import"|"retail";
export type BusinessData = {hero:string[];kpi:string[];products:string[][];clients:string[][];movements:string[][];warehouses:string[][];sales:string[][];debts:string[][];cash:string[][];staff:string[]};
export type PageData = BusinessData|string[]|string[][];
