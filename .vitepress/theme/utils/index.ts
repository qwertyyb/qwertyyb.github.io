export const withCache = <F extends (...args: any[]) => any>(fn: F) => {
  const cache = new Map<string, ReturnType<F>>()
  return (...args: Parameters<F>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    if (result instanceof Promise) {
      result.finally(() => {
        cache.delete(key)
      })
    }
    cache.set(key, result)
    return result
  }
}