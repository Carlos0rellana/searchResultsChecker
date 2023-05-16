type JSONValue = string | number | boolean | { [x: string]: JSONValue } | JSONArray

export interface JSONObject {
  [x: string]: JSONValue
}

export interface JSONArray extends Array<JSONValue> { }
