const green=["ACTIVE","PAID","DELIVERED","CUSTOMER_ACCEPTED","COMPANY_CONFIRMED","CLOSED","ARRIVED","COMPLETED","SENT"];
const orange=["SUBMITTED","UNDER_REVIEW","UNPAID","OPEN","DRAFT","AWAITING_COMPANY_RECEIPT","READY_FOR_COLLECTION","PENDING"];
const blue=["IN_TRANSIT","DISPATCHED","OUT_FOR_DELIVERY","PRELIMINARY_QUOTE_ISSUED","RECEIVED_BY_COMPANY","AT_COMPANY_LOCATION","SEALED","READY"];
const red=["CANCELLED","REJECTED","DAMAGED","MISSING","FAILED","SUSPENDED"];
export function StatusBadge({value}:{value:string}){const tone=green.includes(value)?"green":orange.includes(value)?"orange":blue.includes(value)?"blue":red.includes(value)?"red":"purple";return <span className={`badge ${tone}`}>{value.replaceAll("_"," ")}</span>}
