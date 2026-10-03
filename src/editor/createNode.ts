import { CONTAINER_TYPES, type ContainerType, type Node, type NodeType } from './types.ts'

let nodeSeq = 0

export function resetNodeIdSeq(value = 0): void {
  nodeSeq = value
}

export function createId(prefix = 'n'): string {
  nodeSeq += 1
  return `${prefix}_${nodeSeq.toString(36)}`
}

const TYPE_NAMES: Record<NodeType, string> = {
  container: 'حاوية',
  flex: 'صندوق مرن',
  grid: 'شبكة',
  spacer: 'مسافة',
  divider: 'فاصل',
  heading: 'عنوان',
  text: 'نص',
  list: 'قائمة',
  link: 'رابط',
  image: 'صورة',
  icon: 'أيقونة',
  video: 'فيديو',
  button: 'زر',
  input: 'حقل إدخال',
  form: 'نموذج',
}

export function isContainerType(type: NodeType): type is ContainerType {
  return (CONTAINER_TYPES as readonly string[]).includes(type)
}

export function createNode(type: NodeType, id?: string): Node {
  const node: Node = {
    id: id ?? createId(),
    type,
    name: TYPE_NAMES[type],
    props: {},
    style: {},
    animation: null,
    children: [],
  }

  switch (type) {
    case 'container':
      node.style = {
        display: 'block',
        width: '100%',
        maxWidth: '72rem',
        marginInline: 'auto',
        padding: '1rem',
        boxSizing: 'border-box',
      }
      break
    case 'flex':
      node.style = {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        gap: '1rem',
        width: '100%',
      }
      break
    case 'grid':
      node.style = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '1rem',
        width: '100%',
      }
      break
    case 'spacer':
      node.style = { height: '2rem', width: '100%' }
      break
    case 'divider':
      node.style = {
        width: '100%',
        height: '1px',
        backgroundColor: '#d4d4d4',
        border: 'none',
      }
      break
    case 'heading':
      node.props = { text: 'عنوان', level: 2 }
      node.style = {
        fontSize: '1.5rem',
        fontWeight: 700,
        lineHeight: 1.3,
        margin: '0',
        color: '#171717',
      }
      break
    case 'text':
      node.props = { text: 'نص الفقرة' }
      node.style = {
        fontSize: '1rem',
        lineHeight: 1.7,
        margin: '0',
        color: '#404040',
      }
      break
    case 'list':
      node.props = { items: ['عنصر 1', 'عنصر 2', 'عنصر 3'], ordered: false }
      node.style = {
        margin: '0',
        padding: '0 0 0 1.25rem',
        lineHeight: 1.7,
      }
      break
    case 'link':
      node.props = { text: 'رابط', href: '#', target: '_self' }
      node.style = {
        color: '#2563eb',
        textDecoration: 'underline',
      }
      break
    case 'image':
      node.props = { src: '', alt: 'صورة' }
      node.style = {
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
      }
      break
    case 'icon':
      node.props = { text: '★', label: 'أيقونة' }
      node.style = {
        display: 'inline-flex',
        fontSize: '1.25rem',
        lineHeight: 1,
      }
      break
    case 'video':
      node.props = { src: '', poster: '', controls: true, autoplay: false, loop: false }
      node.style = {
        display: 'block',
        width: '100%',
        maxWidth: '40rem',
        aspectRatio: '16 / 9',
        backgroundColor: '#000000',
      }
      break
    case 'button':
      node.props = { text: 'زر', type: 'button' }
      node.style = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
      }
      break
    case 'input':
      node.props = {
        inputType: 'text',
        name: 'field',
        placeholder: 'أدخل نصًا',
        value: '',
      }
      node.style = {
        display: 'block',
        width: '100%',
        padding: '0.5rem 0.75rem',
        border: '1px solid #d4d4d4',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        boxSizing: 'border-box',
      }
      break
    case 'form':
      node.props = { action: '', method: 'post' }
      node.style = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        width: '100%',
      }
      break
  }

  return node
}
