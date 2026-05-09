export const fetchGet = async ({ api, url, extract, requestConfig }) => {
  const { data } = await api.get(url, requestConfig)
  return extract ? extract(data) : data
}
