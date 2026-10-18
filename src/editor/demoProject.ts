import { createId, createNode } from './createNode.ts'
import { DEFAULT_THEME } from './createProject.ts'
import { internalHref } from './pages.ts'
import type { Node, NodeProps, NodeStyle, Project } from './types.ts'

const HERO_ART = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzFlMjkzYiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzI1NjNlYiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9ImNhcmQiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmZmZmIiBzdG9wLW9wYWNpdHk9IjAuOTUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNkYmVhZmUiIHN0b3Atb3BhY2l0eT0iMC44Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIHJ4PSIzMiIgZmlsbD0idXJsKCNiZykiLz4KPGNpcmNsZSBjeD0iNjQwIiBjeT0iMTIwIiByPSIxODAiIGZpbGw9IiM2MGE1ZmEiIG9wYWNpdHk9IjAuMjUiLz4KPGNpcmNsZSBjeD0iMTQwIiBjeT0iNTIwIiByPSIyMDAiIGZpbGw9IiMwZWE1ZTkiIG9wYWNpdHk9IjAuMiIvPgo8cmVjdCB4PSI5MCIgeT0iMTEwIiB3aWR0aD0iNjIwIiBoZWlnaHQ9IjM4MCIgcng9IjI0IiBmaWxsPSJ1cmwoI2NhcmQpIi8+CjxyZWN0IHg9IjEzMCIgeT0iMTYwIiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjIwIiByeD0iMTAiIGZpbGw9IiMxZTI5M2IiIG9wYWNpdHk9IjAuODUiLz4KPHJlY3QgeD0iMTMwIiB5PSIyMDAiIHdpZHRoPSIzNjAiIGhlaWdodD0iMTIiIHJ4PSI2IiBmaWxsPSIjMzM0MTU1IiBvcGFjaXR5PSIwLjM1Ii8+CjxyZWN0IHg9IjEzMCIgeT0iMjI0IiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEyIiByeD0iNiIgZmlsbD0iIzMzNDE1NSIgb3BhY2l0eT0iMC4yNSIvPgo8cmVjdCB4PSIxMzAiIHk9IjI4MCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSI0NCIgcng9IjEyIiBmaWxsPSIjMjU2M2ViIi8+CjxyZWN0IHg9IjMwMCIgeT0iMjgwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQ0IiByeD0iMTIiIGZpbGw9IiNlMmU4ZjAiLz4KPHJlY3QgeD0iMTMwIiB5PSIzNjAiIHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIHJ4PSIxNiIgZmlsbD0iI2JmZGJmZSIvPgo8cmVjdCB4PSIzMDUiIHk9IjM2MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI5MCIgcng9IjE2IiBmaWxsPSIjZGJlYWZlIi8+CjxyZWN0IHg9IjQ4MCIgeT0iMzYwIiB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiByeD0iMTYiIGZpbGw9IiNlZmY2ZmYiLz4KPC9zdmc+'

type NodePatch = {
  name?: string
  props?: NodeProps
  style?: NodeStyle
  children?: Node[]
  animation?: Node['animation']
}

function apply(node: Node, patch: NodePatch): Node {
  return {
    ...node,
    name: patch.name ?? node.name,
    props: patch.props ? { ...node.props, ...patch.props } : node.props,
    style: patch.style ? { ...node.style, ...patch.style } : node.style,
    children: patch.children ?? node.children,
    animation: patch.animation ?? node.animation,
  }
}

const muted = '#64748b'
const ink = '#0f172a'
const surface = '#ffffff'
const line = '#e2e8f0'
const brand = '#2563eb'

function card(title: string, body: string): Node {
  return apply(createNode('flex'), {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      width: '100%',
      padding: '1.25rem',
      backgroundColor: surface,
      border: `1px solid ${line}`,
      borderRadius: '0.75rem',
    },
    children: [
      apply(createNode('heading'), {
        props: { text: title, level: 3 },
        style: { fontSize: '1.125rem', fontWeight: 700, margin: '0', color: ink },
      }),
      apply(createNode('text'), {
        props: { text: body },
        style: { fontSize: '0.95rem', lineHeight: 1.7, margin: '0', color: muted },
      }),
    ],
  })
}

function navLink(text: string, href: string): Node {
  return apply(createNode('link'), {
    props: { text, href, target: '_self' },
    style: {
      color: '#334155',
      fontSize: '0.95rem',
      fontWeight: 500,
      textDecoration: 'none',
      alignSelf: 'center',
    },
  })
}

function stat(value: string, label: string): Node {
  return apply(createNode('flex'), {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      padding: '1rem 1.25rem',
      backgroundColor: surface,
      border: `1px solid ${line}`,
      borderRadius: '0.75rem',
      minWidth: '9rem',
      flex: '1 1 9rem',
    },
    children: [
      apply(createNode('heading'), {
        props: { text: value, level: 3 },
        style: { fontSize: '1.5rem', fontWeight: 800, margin: '0', color: brand },
      }),
      apply(createNode('text'), {
        props: { text: label },
        style: { fontSize: '0.85rem', margin: '0', color: muted },
      }),
    ],
  })
}

export function createDemoProject(): Project {
  const aboutPageId = createId('p')
  const homePageId = createId('p')

  const brandMark = apply(createNode('icon'), {
    props: { text: 'ق', label: 'شعار قطمة' },
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2rem',
      height: '2rem',
      borderRadius: '0.5rem',
      backgroundColor: ink,
      color: '#ffffff',
      fontSize: '0.95rem',
      fontWeight: 700,
      lineHeight: 1,
    },
  })

  const brandName = apply(createNode('heading'), {
    props: { text: 'قطمة', level: 3 },
    style: { fontSize: '1.125rem', fontWeight: 800, margin: '0', color: ink },
  })

  const brandGroup = apply(createNode('flex'), {
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '0.625rem',
      width: 'auto',
    },
    children: [brandMark, brandName],
  })

  const nav = apply(createNode('flex'), {
    style: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '1.25rem',
      width: 'auto',
    },
    children: [
      navLink('الرئيسية', '#top'),
      navLink('المزايا', '#features'),
      navLink('الأصول', internalHref(aboutPageId)),
    ],
  })

  const headerCta = apply(createNode('button'), {
    props: { text: 'جرّب المحرّر', type: 'button' },
    style: {
      backgroundColor: brand,
      color: '#ffffff',
      padding: '0.55rem 1.1rem',
      borderRadius: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: 600,
    },
  })

  const header = apply(createNode('flex'), {
    name: 'الشريط العلوي',
    style: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      width: '100%',
      padding: '0.875rem 1.25rem',
      backgroundColor: surface,
      border: `1px solid ${line}`,
      borderRadius: '0.875rem',
    },
    children: [brandGroup, nav, headerCta],
  })

  const heroHeading = apply(createNode('heading'), {
    props: { text: 'أهلاً بك في قطمة', level: 1 },
    style: {
      fontSize: '2.5rem',
      fontWeight: 800,
      lineHeight: 1.2,
      margin: '0',
      color: ink,
    },
    animation: {
      trigger: 'load',
      effect: 'fade',
      delay: 0,
      duration: 0.7,
      easing: 'ease-out',
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
      maxWidth: '34rem',
    },
  })

  const startButton = apply(createNode('button'), {
    props: { text: 'ابدأ البناء', type: 'button' },
    style: {
      backgroundColor: brand,
      color: '#ffffff',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: 600,
    },
  })

  const moreLink = apply(createNode('link'), {
    props: { text: 'تعرّف على الأصول', href: internalHref(aboutPageId), target: '_self' },
    style: {
      color: brand,
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

  const heroCopy = apply(createNode('flex'), {
    name: 'نص البطل',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '1.25rem',
      flex: '1 1 22rem',
      minWidth: '18rem',
    },
    children: [heroHeading, heroText, heroActions],
  })

  const heroArt = apply(createNode('image'), {
    name: 'لوحة بصرية',
    props: { src: HERO_ART, alt: 'لوحة تجريبية بألوان المشروع' },
    style: {
      display: 'block',
      width: '100%',
      maxWidth: '26rem',
      height: 'auto',
      borderRadius: '1rem',
      border: `1px solid ${line}`,
      flex: '1 1 20rem',
    },
  })

  const hero = apply(createNode('flex'), {
    name: 'البطل',
    style: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '2rem',
      width: '100%',
      padding: '2.5rem 2rem',
      backgroundColor: '#f8fafc',
      borderRadius: '1.25rem',
      border: `1px solid ${line}`,
    },
    children: [heroCopy, heroArt],
  })

  const featuresHeading = apply(createNode('heading'), {
    props: { text: 'لماذا قطمة؟', level: 2 },
    style: { fontSize: '1.75rem', fontWeight: 800, margin: '0', color: ink },
  })

  const featuresIntro = apply(createNode('text'), {
    props: { text: 'ثلاثة مبادئ تحكم كل قرار في المحرّك.' },
    style: { fontSize: '1rem', margin: '0', color: muted },
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
      card('تخطيط حر', 'Flex و Grid كأصول أولية، بلا قوالب جاهزة.'),
      card('مصدر واحد', 'نفس المولّد يغذّي الكانفا والتصدير.'),
      card('عزل تام', 'المعاينة داخل iframe حتى لا تختلط أنماط المحرّر.'),
    ],
  })

  const stats = apply(createNode('flex'), {
    name: 'أرقام',
    style: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '0.75rem',
      width: '100%',
    },
    children: [
      stat('15', 'قطعة أساسية'),
      stat('2', 'وضعا عمل'),
      stat('100%', 'تصدير HTML'),
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
      backgroundColor: ink,
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
      backgroundColor: surface,
      border: `1px solid ${line}`,
      borderRadius: '0.75rem',
    },
    children: [
      apply(createNode('heading'), {
        props: { text: 'تابع التطوير', level: 3 },
        style: { fontSize: '1.125rem', fontWeight: 700, margin: '0' },
      }),
      apply(createNode('text'), {
        props: { text: 'أدخل بريدك لتصلك مراحل البناء التالية.' },
        style: { fontSize: '0.9rem', margin: '0', color: muted },
      }),
      emailInput,
      submit,
    ],
  })

  const ctaCopy = apply(createNode('flex'), {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      flex: '1 1 20rem',
    },
    children: [
      apply(createNode('heading'), {
        props: { text: 'ابنِ صفحتك الأولى اليوم', level: 2 },
        style: { fontSize: '1.75rem', fontWeight: 800, margin: '0', color: ink },
      }),
      apply(createNode('text'), {
        props: { text: 'جرّب الأدلة التفاعلية والقوائم السياقية على هذا النموذج مباشرة.' },
        style: { fontSize: '1rem', lineHeight: 1.8, margin: '0', color: muted },
      }),
    ],
  })

  const cta = apply(createNode('flex'), {
    name: 'دعوة للتجربة',
    style: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '2rem',
      width: '100%',
      padding: '2rem',
      backgroundColor: '#eff6ff',
      borderRadius: '1rem',
      border: '1px solid #bfdbfe',
    },
    children: [ctaCopy, form],
  })

  const footerText = apply(createNode('text'), {
    props: { text: '© 2026 قطمة — نموذج تجريبي' },
    style: { fontSize: '0.85rem', margin: '0', color: muted },
  })

  const footerLinks = apply(createNode('flex'), {
    style: {
      display: 'flex',
      flexDirection: 'row',
      gap: '1rem',
      width: 'auto',
    },
    children: [navLink('الأصول', internalHref(aboutPageId)), navLink('أعلى الصفحة', '#top')],
  })

  const footer = apply(createNode('flex'), {
    name: 'التذييل',
    style: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      width: '100%',
      paddingBlock: '0.5rem',
    },
    children: [footerText, footerLinks],
  })

  const root = apply(createNode('container'), {
    name: 'الصفحة',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      width: '100%',
      maxWidth: '68rem',
      marginInline: 'auto',
      padding: '1.5rem 1.25rem 3rem',
      boxSizing: 'border-box',
    },
    children: [
      header,
      hero,
      featuresHeading,
      featuresIntro,
      features,
      stats,
      cta,
      createNode('divider'),
      footer,
    ],
  })

  const aboutHeading = apply(createNode('heading'), {
    props: { text: 'الأصول الأولية', level: 1 },
    style: {
      fontSize: '2rem',
      fontWeight: 800,
      margin: '0',
      color: ink,
    },
  })

  const aboutText = apply(createNode('text'), {
    props: {
      text: 'كل صفحة شجرة مستقلة. هذا الرابط يعود إلى الصفحة الرئيسية عبر slug التصدير.',
    },
    style: {
      fontSize: '1.125rem',
      lineHeight: 1.8,
      margin: '0',
      color: '#475569',
      maxWidth: '40rem',
    },
  })

  const aboutList = apply(createNode('list'), {
    props: {
      items: [
        'Flex و Grid أولًا: لا قوالب مخفية.',
        'نفس الشجرة تغذّي الكانفا والمعاينة والتصدير.',
        'الأنماط مقصورة على خصائص آمنة.',
      ],
      ordered: false,
    },
    style: {
      margin: '0',
      paddingInlineStart: '1.25rem',
      lineHeight: 1.9,
      color: '#334155',
    },
  })

  const homeLink = apply(createNode('link'), {
    props: { text: 'العودة للرئيسية', href: internalHref(homePageId), target: '_self' },
    style: {
      color: brand,
      fontWeight: 600,
      textDecoration: 'none',
    },
  })

  const aboutRoot = apply(createNode('container'), {
    name: 'من نحن',
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
    children: [aboutHeading, aboutText, aboutList, homeLink],
  })

  return {
    id: createId('prj'),
    name: 'قطمة',
    theme: { ...DEFAULT_THEME, backgroundColor: '#f1f5f9' },
    pages: [
      {
        id: homePageId,
        name: 'الصفحة الرئيسية',
        slug: 'index',
        root,
      },
      {
        id: aboutPageId,
        name: 'الأصول',
        slug: 'about',
        root: aboutRoot,
      },
    ],
    assets: [],
  }
}
