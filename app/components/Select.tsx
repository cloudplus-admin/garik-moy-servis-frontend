"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string; secondary?: string; searchText?: string };

export function Select({value,options,onChange,className="",disabled=false,ariaLabel,multiple=false,searchable=false}:{value:string;options:SelectOption[];onChange:(value:string)=>void;className?:string;disabled?:boolean;ariaLabel:string;multiple?:boolean;searchable?:boolean}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [menuStyle,setMenuStyle]=useState<React.CSSProperties>({});
  const root=useRef<HTMLDivElement>(null);
  const menu=useRef<HTMLDivElement>(null);
  const id=useId();
  const selectedValues=multiple?value.split(",").filter(Boolean):[value];
  const selected:SelectOption|undefined=multiple&&selectedValues.length?{value,label:`Выбрано: ${selectedValues.length}`}:(options.find(option=>option.value===value)??options[0]);
  const visibleOptions=useMemo(()=>{const term=query.trim().toLocaleLowerCase("ru");return term?options.filter(option=>`${option.label} ${option.secondary??""} ${option.searchText??""}`.toLocaleLowerCase("ru").includes(term)):options},[options,query]);
  useEffect(()=>{
    const close=(event:MouseEvent)=>{if(!root.current?.contains(event.target as Node)&&!menu.current?.contains(event.target as Node))setOpen(false)};
    document.addEventListener("mousedown",close);
    return()=>document.removeEventListener("mousedown",close);
  },[]);
  useEffect(()=>{
    if(!open||!root.current)return;
    const place=()=>{
      const rect=root.current!.getBoundingClientRect(),spaceBelow=window.innerHeight-rect.bottom;
      const maxHeight=Math.max(120,Math.min(280,(spaceBelow>=180?spaceBelow:rect.top)-18));
      setMenuStyle({position:"fixed",left:Math.max(12,Math.min(rect.left,window.innerWidth-Math.max(rect.width,240)-12)),top:spaceBelow>=180?rect.bottom+6:undefined,bottom:spaceBelow<180?window.innerHeight-rect.top+6:undefined,width:Math.max(rect.width,240),maxWidth:"calc(100vw - 24px)",maxHeight});
    };
    place();window.addEventListener("resize",place);window.addEventListener("scroll",place,true);
    return()=>{window.removeEventListener("resize",place);window.removeEventListener("scroll",place,true)};
  },[open]);
  return <div ref={root} className={`custom-select ${className} ${open?"is-open":""}`}>
    <button type="button" aria-label={ariaLabel} aria-controls={id} aria-expanded={open} disabled={disabled} onClick={()=>{setOpen(current=>!current);setQuery("")}}>
      <span className="select-value"><span>{selected?.label}</span>{selected?.secondary&&<small>{selected.secondary}</small>}</span><ChevronDown/>
    </button>
    {open&&createPortal(<div ref={menu} id={id} role="listbox" className="select-menu select-menu-portal" style={menuStyle}>
      {searchable&&<div className="select-search"><input autoFocus aria-label={`Поиск: ${ariaLabel}`} placeholder="Название или SKU" value={query} onChange={event=>setQuery(event.target.value)}/></div>}
      {visibleOptions.map(option=>{const checked=option.value===""?selectedValues.length===0:selectedValues.includes(option.value);return <button type="button" role="option" aria-selected={checked} key={option.value} onClick={()=>{if(!multiple||option.value===""){onChange(option.value);setOpen(false);return}const next=checked?selectedValues.filter(item=>item!==option.value):[...selectedValues,option.value];onChange(next.join(","));setOpen(false)}}>
        <span className="select-option-copy"><span>{option.label}</span>{option.secondary&&<small>{option.secondary}</small>}</span>{checked&&<Check/>}
      </button>})}
      {!visibleOptions.length&&<p className="select-empty">Товар не найден</p>}
    </div>,document.body)}
  </div>
}
