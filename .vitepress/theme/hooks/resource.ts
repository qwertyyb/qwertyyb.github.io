import { onBeforeUnmount, onMounted } from "vue"
import { createInstance } from 'localforage'
import { withCache } from "../utils"

const resourceStore = createInstance({ name: 'vitepress-editor-resources' })

export const useResource = () => {
  const handler = async (event: ErrorEvent) => {
    const target = event.target as HTMLElement
    if (target.nodeName?.toLocaleLowerCase() !== 'img') return
    const img = target as HTMLImageElement
    if (img.dataset.blobUrl) return
    if (!img.src.startsWith('blob:')) return;
    const data = await withCache(resourceStore.getItem.bind(resourceStore))(img.src)
    if (!data) return;
    const blobUrl = URL.createObjectURL(data)
    img.dataset.blobUrl = blobUrl
    img.src = blobUrl
  }
  onMounted(() => {
    document.body.addEventListener('error', handler, true)
  })

  onBeforeUnmount(() => {
    document.body.removeEventListener('error', handler, true)
  })
  return {
    addResource: async (file: File): Promise<string> => {
      const blobUrl = URL.createObjectURL(file)
      await resourceStore.setItem(blobUrl, file)
      return blobUrl
    },
    removeResource: async (blobUrl: string) => {
      await resourceStore.removeItem(blobUrl)
      URL.revokeObjectURL(blobUrl)
    },
    clearResources: async () => {
      const keys = await resourceStore.keys();
      keys.forEach(key => {
        URL.revokeObjectURL(key)
      })
      await resourceStore.clear()
    },
    allResourcesUrls: async () => {
      return await resourceStore.keys()
    },
    getResources: async (blobUrls: string[]) => {
      const resources = await Promise.all(blobUrls.map(async blobUrl => {
        return {
          url: blobUrl,
          file: await resourceStore.getItem<File>(blobUrl)
        }
      }))
      return resources.filter(item => item.file) as { url: string, file: File }[]
    }
  }
}