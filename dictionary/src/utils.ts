export function count(arr: string[]) {
  const res: Record<string, number> = {};
  for (const i of arr) {
    if (res[i]) {
      res[i] += 1;
    } else {
      res[i] = 1;
    }
  }
  return res;
}

export function sort(obj: Object) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

export function sortObject(obj: Object, key: string) {
  return Object.fromEntries(
    Object.entries(obj).sort((a: any, b: any) => b[1][key] - a[1][key])
  );
}

export function filterObject<T>(
  obj: Record<string, T>,
  f: (arg: T) => boolean
) {
  return Object.fromEntries(Object.entries(obj).filter((e) => f(e[1])));
}

export function arrayToObject<T>(arr: T[], key: keyof T) {
  return arr.reduce((sum, cur) => {
    sum[cur[key] as unknown as string] = cur;
    return sum;
  }, {} as Record<string, T>);
}
