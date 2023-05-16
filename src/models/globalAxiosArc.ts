import axios, { AxiosResponse } from 'axios'

export const axiosArc = async (urlQuery: string, methodQuery: string, dataSend: any = null): Promise<AxiosResponse> => {
  const path: string = `../config/${process.env.SANDBOX === 'dev' ? 'dev-' : ''}tokenAccessArc.json`
  const access: {[key: string]: string} = await import(path)
  const config: {[key: string]: any} = {
    method: methodQuery,
    url: `${await access.apiUrl}${urlQuery}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: await access.token
    }
  }
  if (dataSend !== null) {
    config.data = dataSend
  }
  return await axios(config)
}
