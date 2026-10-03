export const NODE_TYPE_GROUPS = {
  layout: ['container', 'flex', 'grid', 'spacer', 'divider'],
  content: ['heading', 'text', 'list', 'link', 'image', 'icon', 'video'],
  interaction: ['button', 'input', 'form'],
} as const

export type NodeType =
  | (typeof NODE_TYPE_GROUPS.layout)[number]
  | (typeof NODE_TYPE_GROUPS.content)[number]
  | (typeof NODE_TYPE_GROUPS.interaction)[number]

export const NODE_TYPES: readonly NodeType[] = [
  ...NODE_TYPE_GROUPS.layout,
  ...NODE_TYPE_GROUPS.content,
  ...NODE_TYPE_GROUPS.interaction,
]

export const CONTAINER_TYPES = ['container', 'flex', 'grid', 'form'] as const

export type ContainerType = (typeof CONTAINER_TYPES)[number]

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type InputType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'email' | 'password'

export type ButtonType = 'button' | 'submit' | 'reset'

export type FormMethod = 'get' | 'post'

export type LinkTarget = '_self' | '_blank'

export type NodeProps = {
  text?: string
  level?: HeadingLevel
  href?: string
  target?: LinkTarget
  src?: string
  alt?: string
  items?: string[]
  ordered?: boolean
  name?: string
  placeholder?: string
  inputType?: InputType
  options?: string[]
  checked?: boolean
  value?: string
  type?: ButtonType
  action?: string
  method?: FormMethod
  poster?: string
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  label?: string
}

export type AnimationTrigger = 'scroll' | 'hover' | 'load'

export type AnimationEffect =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'

export type NodeAnimation = {
  trigger: AnimationTrigger
  effect: AnimationEffect
  delay: number
  duration: number
  easing: string
}

export type NodeStyle = {
  [property: string]: string | number | undefined
}

export type Node = {
  id: string
  type: NodeType
  name: string
  props: NodeProps
  style: NodeStyle
  animation: NodeAnimation | null
  children: Node[]
}

export type Theme = {
  fontFamily: string
  backgroundColor: string
  textColor: string
  direction: 'rtl' | 'ltr'
}

export type Asset = {
  id: string
  name: string
  mimeType: string
  src: string
}

export type Page = {
  id: string
  name: string
  slug: string
  root: Node
}

export type Project = {
  id: string
  name: string
  theme: Theme
  pages: Page[]
  assets: Asset[]
}
