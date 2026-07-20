export function Flash({success,error}:{success?:string;error?:string}){if(!success&&!error)return null;return <div className={`notice ${error?"error":"success"}`}>{error||success}</div>}
