import { AxiosResponse } from 'axios'
import { axiosArc } from './globalAxiosArc'

export const createInArc = async (urlQuery: string, data: any = null): Promise<AxiosResponse> => {
  return await axiosArc(urlQuery, 'post', data)
}
