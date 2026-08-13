"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

export function Select({value,options,onChange,className="",disabled=false,ariaLabel}:{value:string;options:SelectOption[];onChange:(value:string)=>void;className?:string;disabled?:boolean;ariaLabel:string}){
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const id=useId();
  const selected=options.find(option=>option.value===value)??options[0];
  useEffect(()=>{
    const close=(event:MouseEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};
    document.addEventListener("mousedown",close);
    return()=>document.removeEventListener("mousedown",close);
  },[]);
  return <div ref={root} className={`custom-select ${className} ${open?"is-open":""}`}>
    <button type="button" aria-label={ariaLabel} aria-controls={id} aria-expanded={open} disabled={disabled} onClick={()=>setOpen(current=>!current)}>
      <span>{selected?.label}</span><ChevronDown/>
    </button>
    {open&&<div id={id} role="listbox" className="select-menu">
      {options.map(option=><button type="button" role="option" aria-selected={option.value===value} key={option.value} onClick={()=>{onChange(option.value);setOpen(false)}}>
        <span>{option.label}</span>{option.value===value&&<Check/>}
      </button>)}
    </div>}
  </div>
}
