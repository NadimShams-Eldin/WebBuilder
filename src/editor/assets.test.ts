import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addAssetToProject,
  assetHref,
  collectAssetUsages,
  countAssetUsages,
  filterAssets,
  insertAssetImage,
  removeAssetFromProject,
  renameAssetInProject,
  replaceAssetInProject,
  uniqueAssetName,
} from './assets.ts'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'

function withLogo() {
  const project = addAssetToProject(createProject(), {
    id: 'a1',
    name: 'logo.png',
    mimeType: 'image/png',
    src: 'data:image/png;base64,xx',
  })
  const image = createNode('image', 'img')
  image.props = { src: assetHref('a1'), alt: 'شعار' }
  project.pages[0].root.children = [image]
  return project
}

describe('asset library', () => {
  it('renames uniquely and keeps other assets', () => {
    let project = withLogo()
    project = addAssetToProject(project, {
      id: 'a2',
      name: 'banner.png',
      mimeType: 'image/png',
      src: 'data:image/png;base64,yy',
    })
    const renamed = renameAssetInProject(project, 'a1', 'banner.png')
    assert.ok(renamed)
    assert.equal(renamed.assets[0].name, 'banner.png 2')
    assert.equal(uniqueAssetName(project, 'logo.png', 'a1'), 'logo.png')
    assert.equal(renameAssetInProject(project, 'missing', 'x'), null)
  })

  it('replaces file bytes without dropping usages', () => {
    const project = withLogo()
    const next = replaceAssetInProject(project, 'a1', {
      src: 'data:image/png;base64,zz',
      mimeType: 'image/png',
    })
    assert.ok(next)
    assert.equal(next.assets[0].src, 'data:image/png;base64,zz')
    assert.equal(next.pages[0].root.children[0].props.src, assetHref('a1'))
  })

  it('counts usages and unbinds them on delete', () => {
    const project = withLogo()
    const video = createNode('video', 'vid')
    video.props = { src: '', poster: assetHref('a1') }
    project.pages[0].root.children.push(video)
    assert.equal(countAssetUsages(project, 'a1'), 2)
    assert.equal(collectAssetUsages(project, 'a1')[1].field, 'poster')
    const next = removeAssetFromProject(project, 'a1')
    assert.equal(next.assets.length, 0)
    assert.equal(next.pages[0].root.children[0].props.src, '')
    assert.equal(next.pages[0].root.children[1].props.poster, '')
  })

  it('inserts an image node bound to the asset', () => {
    const project = withLogo()
    const result = insertAssetImage(project, 'a1', null)
    assert.ok(result)
    assert.equal(result.node.type, 'image')
    assert.equal(result.node.props.src, assetHref('a1'))
    assert.equal(result.project.pages[0].root.children.length, 2)
  })

  it('filters by name tokens', () => {
    const assets = [
      { id: 'a1', name: 'Hero art', mimeType: 'image/svg+xml', src: '' },
      { id: 'a2', name: 'logo.png', mimeType: 'image/png', src: '' },
    ]
    assert.equal(filterAssets(assets, 'hero').length, 1)
    assert.equal(filterAssets(assets, 'png').length, 1)
    assert.equal(filterAssets(assets, '').length, 2)
  })
})
