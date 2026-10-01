export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-neutral-900">قطمة</span>
        <nav className="flex items-center gap-1 text-sm">
          <button className="rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900">
            لوحة التركيب
          </button>
          <button className="rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50">
            معاينة حية
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-neutral-200">
          <button
            className="px-2 py-1.5 text-neutral-400 hover:text-neutral-700"
            title="تراجع"
          >
            ↷
          </button>
          <button
            className="px-2 py-1.5 text-neutral-400 hover:text-neutral-700"
            title="إعادة"
          >
            ↶
          </button>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          Publish
        </button>
      </div>
    </header>
  )
}
