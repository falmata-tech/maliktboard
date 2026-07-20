import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return{name:"MaliktBoard Field Scanner",short_name:"MaliktBoard",description:"Scan and update shipments and Dispatch Batches.",start_url:"/mobile",display:"standalone",background_color:"#f5f8f7",theme_color:"#102c32",icons:[{src:"/icons/icon.svg",sizes:"any",type:"image/svg+xml"}]};}
