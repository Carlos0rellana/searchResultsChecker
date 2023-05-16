import { AxiosResponse } from 'axios'
import { axiosArc } from './globalAxiosArc'

export const updateInArc = async (urlQuery: string, data: any = null): Promise<AxiosResponse> => {
  return await axiosArc(urlQuery, 'put', data)
}
