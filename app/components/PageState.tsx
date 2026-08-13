import {Boxes} from "lucide-react";
export function PageState({kind,message,retry}:{kind:"loading"|"error"|"empty";message?:string;retry?:()=>void}){
 return <section className="card data-state" role={kind==="error"?"alert":"status"}><span className={`state-icon ${kind}`}><Boxes/></span><h2>{kind==="loading"?"Загружаем данные":kind==="error"?"Сервер данных недоступен":"В этом разделе пока нет данных"}</h2><p>{message??(kind==="loading"?"Получаем данные только для открытого раздела":"Выбери другой бизнес или раздел")}</p>{retry&&<button className="primary" onClick={retry}>Повторить</button>}</section>
}
