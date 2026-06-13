// Tiny DOM builder shared by the popup and module panels.
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Omit<HTMLElementTagNameMap[K], 'style'>> & { style?: string } = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { style, ...rest } = props;
  Object.assign(node, rest);
  if (style) node.style.cssText = style;
  for (const c of children) node.append(c);
  return node;
}
