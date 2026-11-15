export type CodedComponent = { code: string; name: string };

// Codes remain separate from names in stored documents; only the selector uses the joined label.
export const formatCodedComponent = ({ code, name }: CodedComponent) =>
  code && name ? `${code}. ${name}` : name || code;

export const parseCodedComponent = (
  value: string,
  catalog: readonly CodedComponent[],
): CodedComponent => {
  const fixed = catalog.find((component) => formatCodedComponent(component) === value.trim());
  if (fixed) return { code: fixed.code, name: fixed.name };

  // Keep trailing spaces during typing to allow multi-word custom names.
  const match = /^(.+?)\.\s+(.+)$/.exec(value);
  return match ? { code: match[1].trim(), name: match[2] } : { code: '', name: value };
};

export const codedComponentOptionCategory = (group: string) => `componentRequestCode:${group}`;
