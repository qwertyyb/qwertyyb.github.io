import { ref } from "vue"
import { PUBLISH_SETTINGS_STORAGE_KEY } from "../const"

export interface Setting {
  owner: string
  repo: string
  auth: string
}

const getDefaultSetting = (): Setting => {
  try {
    const obj = JSON.parse(localStorage.getItem(PUBLISH_SETTINGS_STORAGE_KEY) || '{}') as Setting
    return { owner: obj.owner || '', repo: obj.repo || '', auth: obj.auth || '' }
  } catch {
    return { owner: '', repo: '', auth: '' }
  }
}

export const useSettings = () => {
  const settings = ref<Setting>(getDefaultSetting())


  const saveSettings = () => {
    localStorage.setItem(PUBLISH_SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
  }
  return { settings, saveSettings }
}