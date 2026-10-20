import { parseCssLength } from './canvasGuides.ts'
import type { GuideRect } from './canvasGuides.ts'

export type BoxSides = {
  top: number
  right: number
  bottom: number
  left: number
}

export type BoxModel = {
  borderBox: GuideRect
  contentBox: GuideRect
  marginBox: GuideRect
  margin: BoxSides
  padding: BoxSides
  border: BoxSides
}

export type BoxStrip = {
  side: keyof BoxSides
  top: number
  left: number
  width: number
  height: number
  value: number
}

export type BoxStyleLike = {
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  paddingTop: string
  paddingRight: string
  paddingBottom: string
  paddingLeft: string
  borderTopWidth: string
  borderRightWidth: string
  borderBottomWidth: string
  borderLeftWidth: string
}

const EMPTY_SIDES: BoxSides = { top: 0, right: 0, bottom: 0, left: 0 }

export function emptyBoxSides(): BoxSides {
  return { ...EMPTY_SIDES }
}

export function readBoxSides(style: BoxStyleLike): Pick<BoxModel, 'margin' | 'padding' | 'border'> {
  return {
    margin: {
      top: parseCssLength(style.marginTop),
      right: parseCssLength(style.marginRight),
      bottom: parseCssLength(style.marginBottom),
      left: parseCssLength(style.marginLeft),
    },
    padding: {
      top: parseCssLength(style.paddingTop),
      right: parseCssLength(style.paddingRight),
      bottom: parseCssLength(style.paddingBottom),
      left: parseCssLength(style.paddingLeft),
    },
    border: {
      top: parseCssLength(style.borderTopWidth),
      right: parseCssLength(style.borderRightWidth),
      bottom: parseCssLength(style.borderBottomWidth),
      left: parseCssLength(style.borderLeftWidth),
    },
  }
}

export function hasBoxSides(sides: BoxSides, min = 0.5): boolean {
  return sides.top > min || sides.right > min || sides.bottom > min || sides.left > min
}

export function insetRect(rect: GuideRect, sides: BoxSides): GuideRect {
  return {
    top: rect.top + sides.top,
    left: rect.left + sides.left,
    width: Math.max(0, rect.width - sides.left - sides.right),
    height: Math.max(0, rect.height - sides.top - sides.bottom),
  }
}

export function expandRect(rect: GuideRect, sides: BoxSides): GuideRect {
  return {
    top: rect.top - sides.top,
    left: rect.left - sides.left,
    width: Math.max(0, rect.width + sides.left + sides.right),
    height: Math.max(0, rect.height + sides.top + sides.bottom),
  }
}

export function boxModelFromRect(
  borderBox: GuideRect,
  sides: Pick<BoxModel, 'margin' | 'padding' | 'border'>,
): BoxModel {
  const paddingOuter = insetRect(borderBox, sides.border)
  return {
    borderBox,
    contentBox: insetRect(paddingOuter, sides.padding),
    marginBox: expandRect(borderBox, sides.margin),
    margin: sides.margin,
    padding: sides.padding,
    border: sides.border,
  }
}

export function ringStrips(outer: GuideRect, inner: GuideRect, sides: BoxSides, min = 0.5): BoxStrip[] {
  const strips: BoxStrip[] = []
  const innerBottom = inner.top + inner.height
  const innerRight = inner.left + inner.width
  const outerBottom = outer.top + outer.height
  const outerRight = outer.left + outer.width

  if (sides.top > min) {
    const height = inner.top - outer.top
    if (height > min) {
      strips.push({
        side: 'top',
        top: outer.top,
        left: outer.left,
        width: outer.width,
        height,
        value: sides.top,
      })
    }
  }
  if (sides.bottom > min) {
    const height = outerBottom - innerBottom
    if (height > min) {
      strips.push({
        side: 'bottom',
        top: innerBottom,
        left: outer.left,
        width: outer.width,
        height,
        value: sides.bottom,
      })
    }
  }
  if (sides.left > min) {
    const width = inner.left - outer.left
    if (width > min) {
      strips.push({
        side: 'left',
        top: inner.top,
        left: outer.left,
        width,
        height: inner.height,
        value: sides.left,
      })
    }
  }
  if (sides.right > min) {
    const width = outerRight - innerRight
    if (width > min) {
      strips.push({
        side: 'right',
        top: inner.top,
        left: innerRight,
        width,
        height: inner.height,
        value: sides.right,
      })
    }
  }
  return strips
}

export function formatBoxDim(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function formatBoxSize(width: number, height: number): string {
  return `${formatBoxDim(width)} × ${formatBoxDim(height)}`
}
