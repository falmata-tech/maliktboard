export const formatDate=(value?:string|null)=>value?new Intl.DateTimeFormat("en",{dateStyle:"medium",timeStyle:value.includes("T")?"short":undefined}).format(new Date(value)):"—";
export const money=(amount:number|null|undefined,currency="ETB")=>new Intl.NumberFormat("en",{style:"currency",currency,maximumFractionDigits:0}).format(amount||0);
export const maskPhone=(phone:string)=>phone.length>6?`${phone.slice(0,4)}•••${phone.slice(-3)}`:phone;
