export const CSS_GROUPS = {
  layout: [
    'display',
    'flexDirection',
    'flexWrap',
    'justifyContent',
    'alignItems',
    'alignContent',
    'alignSelf',
    'gap',
    'rowGap',
    'columnGap',
    'gridTemplateColumns',
    'gridTemplateRows',
    'gridAutoFlow',
    'gridColumn',
    'gridRow',
    'placeItems',
    'placeContent',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'inset',
    'overflow',
    'overflowX',
    'overflowY',
    'zIndex',
    'order',
    'flexGrow',
    'flexShrink',
    'flexBasis',
    'flex',
  ],
  dimensions: [
    'width',
    'height',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'boxSizing',
    'aspectRatio',
  ],
  spacing: [
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'marginInline',
    'marginBlock',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'paddingInline',
    'paddingBlock',
  ],
  typography: [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'lineHeight',
    'letterSpacing',
    'wordSpacing',
    'textAlign',
    'textDecoration',
    'textTransform',
    'textOverflow',
    'whiteSpace',
    'direction',
    'verticalAlign',
  ],
  colors: [
    'color',
    'backgroundColor',
    'backgroundImage',
    'backgroundSize',
    'backgroundPosition',
    'backgroundRepeat',
    'opacity',
  ],
  borders: [
    'border',
    'borderWidth',
    'borderStyle',
    'borderColor',
    'borderRadius',
    'borderTop',
    'borderRight',
    'borderBottom',
    'borderLeft',
    'outline',
  ],
  shadows: ['boxShadow', 'textShadow'],
  effects: [
    'transform',
    'transformOrigin',
    'transition',
    'filter',
    'objectFit',
    'objectPosition',
    'cursor',
    'pointerEvents',
    'visibility',
  ],
} as const

export type CssGroupName = keyof typeof CSS_GROUPS

export const ALLOWED_CSS_PROPS: ReadonlySet<string> = new Set(
  Object.values(CSS_GROUPS).flatMap((group) => [...group]),
)

export function isAllowedCssProp(prop: string): boolean {
  return ALLOWED_CSS_PROPS.has(prop)
}

export function toKebabCase(prop: string): string {
  return prop.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
}

export function filterStyle(
  style: Record<string, string | number | undefined>,
): Array<[string, string]> {
  const result: Array<[string, string]> = []

  for (const prop of ALLOWED_CSS_PROPS) {
    const value = style[prop]
    if (value === undefined || value === '') continue
    result.push([prop, String(value)])
  }

  return result
}
