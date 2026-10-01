export function LeftPanel() {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-3">
        <p className="text-sm font-semibold text-neutral-700">خصائص العنصر</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-neutral-400">
          اختر عنصرًا من الكانفا أو من شجرة الطبقات لعرض خصائصه
        </p>
      </div>
    </aside>
  )
}
