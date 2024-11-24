export function getObjectValueByKeyPath(obj: any, keyPath: string) {
  let value = obj;
  const keys = keyPath.split('.');

  for (let i = 0; i < keys?.length; i++) {
    if (!value[keys[i]]) {
      return undefined;
    }

    value = value[keys[i]];
  }

  return value;
}

export function setObjectValueByKeyPath(obj: any, keyPath: string, value: any) {
  const keys = keyPath.split('.');

  if (keys?.length === 1) {
    obj[keys[0]] = value;
  } else {
    const sub = obj[keys[0]]?.constructor.name === 'Object' ? obj[keys[0]] : {};
    obj[keys[0]] = setObjectValueByKeyPath(sub, keys.slice(1).join('.'), value);
  }

  return obj;
}

export function toCamelCase(str: string, ucfirst?: boolean) {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // - Replace dash, dot and underscore with whitespace.
  // - Keep only alphanumeric and whitespace characters.
  // - Convert the string to either camelCase or CamelCase depending on the ucfirst argument.
  return str
    .toLowerCase()
    .replace(/[-._]+/g, ' ')
    .replace(/[^a-zA-Z0-9\s]+/g, '')
    .replace(/(?:\s|[A-Z]|\b\w)/g, function (letter, index) {
      return (ucfirst && index === 0) || index > 0
        ? letter.toUpperCase()
        : letter.toLowerCase();
    })
    .replace(/\s+/g, '');
}

export function openNewTab(url: string) {
  window.open(url, '_blank');
}

/**
 * Cleans an object or array by removing null or undefined values.
 *
 * @param value - The value to clean.
 * @returns The cleaned value or an error message if an error occurs.
 */
export function removeNullAndUndefinedValues<T>(value: T): T {
  try {
    if (Array.isArray(value)) {
      return value.filter((item) => item !== null && item !== undefined) as T;
    }

    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).filter(
          ([_, val]) => val !== null && val !== undefined,
        ),
      ) as T;
    }

    return value;
  } catch (error) {
    console.error(error);
    return value;
  }
}
