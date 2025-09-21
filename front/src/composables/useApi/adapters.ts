export const plainAdapter = {
  collection: <T>(raw: any) => raw as T[],
  single: <T>(raw: any) => raw as T,
}

export const strapiAdapter = {
  collection: <T>(raw: any) => (raw?.data ?? []) as T[],
  single: <T>(raw: any) => (raw?.data ?? null) as T,
}