export function groupBy(collection, getKey) {
  const groups = new Map();
  for (const item of collection) {
    const key = getKey(item);
    const group = groups.get(key) || [];
    groups.set(key, group);
    group.push(item);
  }
  return groups;
}