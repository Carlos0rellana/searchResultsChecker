import { AxiosResponse } from "axios"
import { axiosArc } from "./globalAxiosArc"

export const getDataFromArc = async (urlQuery:string): Promise<AxiosResponse> => {
  return await axiosArc(urlQuery,'get')
}