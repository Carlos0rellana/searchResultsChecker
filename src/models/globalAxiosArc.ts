import axios, { AxiosResponse } from "axios"

export const axiosArc = async (urlQuery:string,methodQuery:string,dataSend:any=null): Promise<AxiosResponse> => {
    const path = `../config/${process.env.SANDBOX ==='dev' ? 'dev-':''}tokenAccessArc.json`
    let access = await import(path)
    const config: {[key:string]:any} = {
      method: methodQuery,
      url: `${await access.apiUrl}${urlQuery}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: await access.token
      }
    }
    if(dataSend!==null){
        config.data=dataSend
    }
    return await axios(config)
}