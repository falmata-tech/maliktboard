export type Locale="en"|"am"|"om";
const messages={
 en:{request:"Request a shipment",track:"Track shipment",sender:"Sender",receiver:"Receiver",contents:"Package contents",description:"Description",origin:"Origin company location",destination:"Destination company location",submit:"Submit request",story:"How we serve you",locations:"Our locations",quote:"Preliminary quote",accept:"Accept quote",abandon:"Abandon",status:"Shipment status"},
 am:{request:"መላኪያ ይጠይቁ",track:"መላኪያን ይከታተሉ",sender:"ላኪ",receiver:"ተቀባይ",contents:"የጥቅሉ ይዘት",description:"መግለጫ",origin:"መነሻ የኩባንያ ቦታ",destination:"መድረሻ የኩባንያ ቦታ",submit:"ጥያቄውን ላክ",story:"እንዴት እንደምናገለግል",locations:"ቦታዎቻችን",quote:"የመጀመሪያ ዋጋ",accept:"ዋጋውን ተቀበል",abandon:"ተው",status:"የመላኪያ ሁኔታ"},
 om:{request:"Ergaa gaafadhu",track:"Ergaa hordofi",sender:"Ergaa",receiver:"Fudhataa",contents:"Wanta paakeejii keessaa",description:"Ibsa",origin:"Bakka ka'umsa dhaabbataa",destination:"Bakka ga'umsaa dhaabbataa",submit:"Gaaffii ergi",story:"Akkaataa tajaajila keenyaa",locations:"Bakkeewwan keenya",quote:"Gatii jalqabaa",accept:"Gatii fudhadhu",abandon:"Dhiisi",status:"Haala ergaa"}
} as const;
export function t(locale:string,key:keyof typeof messages.en):string{return (messages[locale as Locale]||messages.en)[key];}
export function localeFrom(value?:string):Locale{return value==="am"||value==="om"?value:"en";}
