import { AxiosResponse } from "axios"
import { axiosArc } from "./globalAxiosArc"

export const deleteDataFromArc = async (urlQuery:string,data:any=null): Promise<AxiosResponse> => {
  return await axiosArc(urlQuery,'delete',data)
}