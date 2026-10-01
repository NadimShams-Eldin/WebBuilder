export function CanvasArea() {
  return (
    <main className="flex h-full flex-1 flex-col bg-neutral-100">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <button className="rounded border border-neutral-200 px-2 py-1">حاسوب</button>
          <button className="rounded px-2 py-1 hover:bg-neutral-50">لوحي</button>
          <button className="rounded px-2 py-1 hover:bg-neutral-50">هاتف</button>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <button className="rounded border border-neutral-200 px-2 py-1">−</button>
          <span>100%</span>
          <button className="rounded border border-neutral-200 px-2 py-1">+</button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-8">
        <div className="flex h-full w-full max-w-3xl items-center justify-center rounded-lg bg-white shadow-sm">
          <p className="text-sm text-neutral-400">
            الكانفا فارغة - ابدأ بإضافة العناصر من لوحة القطع
          </p>
        </div>
      </div>
    </main>
  )
}
