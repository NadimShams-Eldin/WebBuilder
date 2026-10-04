import { createId, createNode } from './createNode.ts'
import { DEFAULT_THEME } from './createProject.ts'
import type { Node, NodeProps, NodeStyle, Project } from './types.ts'

function apply(node: Node, patch: { name?: string; props?: NodeProps; style?: NodeStyle; children?: Node[] }): Node {
  return {
    ...node,
    name: patch.name ?? node.name,
    props: patch.props ? { ...node.props, ...patch.props } : node.props,
    style: patch.style ? { ...node.style, ...patch.style } : node.style,
    children: patch.children ?? node.children,
  }
}

export function createDemoProject(): Project {
  const heroHeading = apply(createNode('heading'), {
    props: { text: 'أهلاً بك في قطمة', level: 1 },
    style: {
      fontSize: '2.5rem',
      fontWeight: 800,
      lineHeight: 1.2,
      margin: '0',
      color: '#0f172a',
    },
  })

  const heroText = apply(createNode('text'), {
    props: {
      text: 'محرّر مواقع يركّب الصفحات من عناصر أولية. هذه شجرة تجريبية يولّدها المحرّك نفسه وتُعرض داخل إطار معزول.',
    },
    style: {
      fontSize: '1.125rem',
      lineHeight: 1.8,
      margin: '0',
      color: '#475569',
      maxWidth: '40rem',
    },
  })

  const startButton = apply(createNode('button'), {
    props: { text: 'ابدأ البناء', type: 'button' },
    style: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: 600,
    },
  })

  const moreLink = apply(createNode('link'), {
    props: { text: 'تعرّف على الأصول', href: '#', target: '_self' },
    style: {
      color: '#2563eb',
      alignSelf: 'center',
      fontWeight: 600,
      textDecoration: 'none',
    },
  })

  const heroActions = apply(createNode('flex'), {
    style: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '0.75rem',
      alignItems: 'center',
      width: 'auto',
    },
    children: [startButton, moreLink],
  })

  const hero = apply(createNode('flex'), {
    name: 'البطل',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '1.25rem',
      width: '100%',
      padding: '2.5rem 2rem',
      backgroundColor: '#f8fafc',
      borderRadius: '1.25rem',
      border: '1px solid #e2e8f0',
    },
    children: [heroHeading, heroText, heroActions],
  })

  const feature = (title: string, body: string): Node =>
    apply(createNode('flex'), {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '100%',
        padding: '1.25rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
      },
      children: [
        apply(createNode('heading'), {
          props: { text: title, level: 3 },
          style: { fontSize: '1.125rem', fontWeight: 700, margin: '0', color: '#0f172a' },
        }),
        apply(createNode('text'), {
          props: { text: body },
          style: { fontSize: '0.95rem', margin: '0', color: '#64748b' },
        }),
      ],
    })

  const features = apply(createNode('grid'), {
    name: 'المزايا',
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
      gap: '1rem',
      width: '100%',
    },
    children: [
      feature('تخطيط حر', 'Flex و Grid كأصول أولية، بلا قوالب جاهزة.'),
      feature('مصدر واحد', 'نفس المولّد يغذّي الكانفا والتصدير.'),
      feature('عزل تام', 'المعاينة داخل iframe حتى لا تختلط أنماط المحرّر.'),
    ],
  })

  const emailInput = apply(createNode('input'), {
    props: { inputType: 'email', name: 'email', placeholder: 'بريدك الإلكتروني' },
    style: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '1px solid #cbd5e1',
      borderRadius: '0.5rem',
    },
  })

  const submit = apply(createNode('button'), {
    props: { text: 'أبقني على اطلاع', type: 'submit' },
    style: {
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '0.75rem 1.25rem',
      borderRadius: '0.5rem',
      width: '100%',
    },
  })

  const form = apply(createNode('form'), {
    name: 'النشرة',
    props: { action: '#', method: 'post' },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      width: '100%',
      maxWidth: '24rem',
      padding: '1.5rem',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '0.75rem',
    },
    children: [
      apply(createNode('heading'), {
        props: { text: 'تابع التطوير', level: 3 },
        style: { fontSize: '1.125rem', fontWeight: 700, margin: '0' },
      }),
      apply(createNode('text'), {
        props: { text: 'أدخل بريدك لتصلك مراحل البناء التالية.' },
        style: { fontSize: '0.9rem', margin: '0', color: '#64748b' },
      }),
      emailInput,
      submit,
    ],
  })

  const root = apply(createNode('container'), {
    name: 'الصفحة',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      width: '100%',
      maxWidth: '56rem',
      marginInline: 'auto',
      padding: '2rem 1.25rem 3rem',
      boxSizing: 'border-box',
    },
    children: [hero, features, createNode('divider'), form],
  })

  return {
    id: createId('prj'),
    name: 'قطمة',
    theme: { ...DEFAULT_THEME, backgroundColor: '#f1f5f9' },
    pages: [
      {
        id: createId('p'),
        name: 'الصفحة الرئيسية',
        slug: 'index',
        root,
      },
    ],
    assets: [],
  }
}
