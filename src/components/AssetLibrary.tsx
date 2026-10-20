import { useMemo, useState } from 'react'
import { countAssetUsages, filterAssets } from '../editor/assets.ts'
import { useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'

export function AssetLibrary() {
  const { t } = useI18n()
  const project = useEditorStore((s) => s.project)
  const addAsset = useEditorStore((s) => s.addAsset)
  const insertAsset = useEditorStore((s) => s.insertAsset)
  const renameAsset = useEditorStore((s) => s.renameAsset)
  const replaceAsset = useEditorStore((s) => s.replaceAsset)
  const removeAsset = useEditorStore((s) => s.removeAsset)
  const [query, setQuery] = useState('')
  const assets = useMemo(() => filterAssets(project.assets, query), [project.assets, query])

  return (
    <div className="flex flex-col gap-3">
      <label className="cursor-pointer rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-center text-xs text-neutral-700 hover:border-blue-400 hover:bg-blue-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-blue-400">
        {t('assets.upload')}
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void addAsset(file)
          }}
        />
      </label>
      {project.assets.length > 0 ? (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('assets.search')}
          className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      ) : null}

      {assets.length === 0 ? (
        <p className="text-xs leading-6 text-neutral-400">{t('assets.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {assets.map((asset) => {
            const uses = countAssetUsages(project, asset.id)
            return (
              <li
                key={asset.id}
                className="rounded-md border border-neutral-200 p-2 dark:border-neutral-700"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={asset.src}
                    alt={asset.name}
                    className="h-10 w-10 shrink-0 rounded object-cover bg-neutral-100 dark:bg-neutral-800"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-100">
                      {asset.name}
                    </p>
                    <p className="truncate text-[10px] text-neutral-400">
                      {asset.mimeType} · {t('assets.uses').replace('{count}', String(uses))}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="rounded bg-neutral-900 px-2 py-1 text-[11px] text-white dark:bg-neutral-100 dark:text-neutral-900"
                    onClick={() => insertAsset(asset.id)}
                  >
                    {t('assets.insert')}
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={() => {
                      const next = window.prompt(t('assets.promptName'), asset.name)
                      if (next) renameAsset(asset.id, next)
                    }}
                  >
                    {t('assets.rename')}
                  </button>
                  <label className="cursor-pointer rounded px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    {t('assets.replace')}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ''
                        if (file) void replaceAsset(asset.id, file)
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => removeAsset(asset.id)}
                  >
                    {t('assets.delete')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
