const GROUPS = [
  { title: 'تخطيط', items: ['حاوية', 'صندوق مرن', 'شبكة', 'مسافة', 'فاصل'] },
  { title: 'محتوى', items: ['عنوان', 'نص', 'قائمة', 'رابط', 'صورة', 'أيقونة', 'فيديو'] },
  { title: 'تفاعل', items: ['زر', 'حقل إدخال', 'نموذج'] },
]

export function RightPanel() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-neutral-200 bg-white">
      <div className="flex items-center gap-1 border-b border-neutral-200 p-2 text-sm">
        <button className="flex-1 rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900">
          Blocks
        </button>
        <button className="flex-1 rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50">
          Outline
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {GROUPS.map((group) => (
          <section key={group.title} className="mb-4">
            <h3 className="mb-2 text-xs font-semibold text-neutral-400">{group.title}</h3>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((item) => (
                <div
                  key={item}
                  className="cursor-grab rounded-md border border-neutral-200 bg-neutral-50 px-2 py-3 text-center text-xs text-neutral-600 hover:border-blue-400 hover:bg-blue-50"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  )
}
