import {
  formatBoxSize,
  hasBoxSides,
  ringStrips,
  type BoxModel,
  type BoxStrip,
} from '../editor/boxModel.ts'
import type { GuideRect } from '../editor/canvasGuides.ts'
import { useI18n } from '../editor/useI18n.ts'

function StripLayer({
  strips,
  fillClass,
  labelClass,
  kind,
}: {
  strips: BoxStrip[]
  fillClass: string
  labelClass: string
  kind: string
}) {
  return (
    <>
      {strips.map((strip) => (
        <div
          key={`${kind}-${strip.side}`}
          className={`pointer-events-none absolute ${fillClass}`}
          data-guide={`${kind}-${strip.side}`}
          style={{
            top: strip.top,
            left: strip.left,
            width: strip.width,
            height: strip.height,
          }}
        >
          {strip.width >= 14 && strip.height >= 12 ? (
            <span
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-0.5 text-[9px] leading-none ${labelClass}`}
            >
              {Math.round(strip.value)}
            </span>
          ) : null}
        </div>
      ))}
    </>
  )
}

export function BoxModelOverlay({
  model,
  name,
}: {
  model: BoxModel
  name?: string
}) {
  const { t } = useI18n()
  const marginStrips = hasBoxSides(model.margin)
    ? ringStrips(model.marginBox, model.borderBox, model.margin)
    : []
  const paddingStrips = hasBoxSides(model.padding)
    ? ringStrips(model.borderBox, model.contentBox, model.padding)
    : []
  const size = formatBoxSize(model.borderBox.width, model.borderBox.height)
  const badgeTop = model.borderBox.top + model.borderBox.height + 4
  const badgeLeft = model.borderBox.left

  return (
    <>
      <StripLayer
        strips={marginStrips}
        fillClass="bg-orange-400/35"
        labelClass="bg-orange-600 text-white"
        kind="margin"
      />
      <StripLayer
        strips={paddingStrips}
        fillClass="bg-lime-400/35"
        labelClass="bg-lime-700 text-white"
        kind="padding"
      />
      <div
        className="pointer-events-none absolute z-[1] flex max-w-[min(100%,16rem)] items-center gap-1 rounded-sm bg-blue-600 px-1.5 py-0.5 text-[10px] leading-none text-white shadow-sm"
        data-guide="size"
        title={t('guides.size')}
        style={{ top: badgeTop, left: badgeLeft }}
      >
        {name ? <span className="truncate font-medium">{name}</span> : null}
        {name ? <span className="opacity-70">|</span> : null}
        <span>{size}</span>
      </div>
    </>
  )
}

export function ParentOutline({
  rect,
  label,
  size,
}: {
  rect: GuideRect
  label: string
  size: string
}) {
  return (
    <>
      <div
        className="absolute border border-teal-500/80"
        data-guide="parent"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
      />
      <div
        className="pointer-events-none absolute z-[1] flex max-w-[min(100%,18rem)] items-center gap-1 rounded-sm bg-teal-600 px-1.5 py-0.5 text-[10px] leading-none text-white shadow-sm"
        data-guide="parent-size"
        style={{
          top: Math.max(0, rect.top - 18),
          left: rect.left,
        }}
      >
        <span className="truncate font-medium">{label}</span>
        <span className="opacity-70">|</span>
        <span>{size}</span>
      </div>
    </>
  )
}
