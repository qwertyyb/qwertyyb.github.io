<template>
  <dialog class="setting-dialog" ref="settingDialog">
    <div class="dialog-header">
      <h3 class="dialog-title">设置</h3>
      <div class="dialog-close-btn" @click="close"><svg t="1765256030401" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1822" width="256" height="256"><path d="M821.24 935.991c31.687 31.688 83.063 31.688 114.751 0 31.688-31.688 31.688-83.064 0-114.752L202.518 87.766c-31.688-31.688-83.064-31.688-114.752 0-31.688 31.688-31.688 83.064 0 114.752L821.239 935.99z" fill="#4A4A4A" p-id="1823"></path><path d="M202.518 935.991c-31.688 31.688-83.064 31.688-114.752 0-31.688-31.688-31.688-83.064 0-114.752L821.239 87.766c31.688-31.688 83.064-31.688 114.752 0 31.688 31.688 31.688 83.064 0 114.752L202.518 935.99z" fill="#4A4A4A" p-id="1824"></path></svg></div>
    </div>
    <form class="setting-content" @submit.prevent="saveSettings">
      <fieldset class="publish-settings settings-block">
        <legend class="settings-title">发布配置</legend>
        <div class="form-item">
          <label for="owner" class="form-label">Owner: </label>
          <input type="text" name="owner" class="form-input" v-model.trim="settings.owner">
        </div>
        <div class="form-item">
          <label for="repo" class="form-label">Repo: </label>
          <input type="text" name="repo" class="form-input" v-model.trim="settings.repo">
        </div>
        <div class="form-item">
          <label for="auth" class="form-label">Auth: </label>
          <input type="text" name="auth" class="form-input" v-model.trim="settings.auth">
        </div>
      </fieldset>
      <div class="form-actions">
        <input type="submit" value="Submit" class="submit-btn"></input>
      </div>
    </form>
  </dialog>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import { useSettings } from '../hooks/settings';

const settingDialog = useTemplateRef('settingDialog')

const { settings, saveSettings } = useSettings();

const open = () => {
  settingDialog.value?.showModal();
}

const close = () => {
  settingDialog.value?.close()
}

defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped>
.setting-dialog {
  border: 1px solid var(--vp-c-gutter);
}
dialog.setting-dialog {
  transition: all .3s allow-discrete;
  translate: 0 -30vh;
  opacity: 0;
  &[open] {
    translate: 0 0;
    opacity: 1;
  }
}

@starting-style {
  dialog.setting-dialog[open] {
    translate: 0 -30vh;
    opacity: 0;
  }
  dialog.setting-dialog::backdrop {
    background-color: 0;
  }
}
dialog.setting-dialog[open]::backdrop {
  transition: all .3s allow-discrete;
  background-color: rgba(0, 0, 0, 0.5);

}
.setting-dialog .dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.setting-dialog .dialog-header .dialog-close-btn {
  cursor: pointer;
}
.setting-dialog .dialog-header .dialog-close-btn svg {
  width: 28px;
  height: 28px;
  padding: 4px;
}
.setting-dialog .dialog-title {
  font-weight: bold;
}
.form-item {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  width: 300px;
}
.form-item + .form-item {
  margin-top: 12px;
}
.form-item label {
  font-size: 14px;
  font-weight: 500;
}
.form-item input {
  border-bottom: 1px solid var(--vp-c-gutter);
}
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.form-actions .submit-btn {
  background-color: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  padding: 6px 16px;
  border: var(--vp-button-brand-border);
  border-radius: 4px;
  font-weight: 500;
}

.publish-settings {
  padding: 0 16px 16px 16px;
  margin-top: 16px;
  legend {
    background: var(--vp-c-brand-1);
    color: #fff;
    padding: 3px 8px;
  }
}
</style>