<template>
  <div class="docs-list">
    <div class="content">
      <ul class="list">
        <li class="item" v-for="(item, index) in docs" :key="index">
          <a :href="withBase(item.url)" :title="item.title">
            <h3 class="doc-title">{{ item.title }}</h3>
          </a>
          <p class="doc-created">{{ formatDate(item.created) }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { withBase } from 'vitepress';
import { data as docs } from './docs.data.ts'

const formatDate = (date: string) => {
  return date.split('T')[0]
}
</script>

<style>
.docs-list .content {
  max-width: calc(var(--vp-layout-max-width) - 64px);
  padding: 16px;
  margin: 0 auto;
}
.docs-list .list {
  margin-top: 16px;
}
.docs-list .item {
  padding: 12px 0;
}
.docs-list .item + .item {
  border-top: 1px solid var(--vp-c-gutter);
}
.docs-list .item {
  transition: all .2s;
}
.docs-list .item:hover {
  color: var(--vp-c-brand-1);
}
.docs-list .doc-title {
  font-size: 16px;
  margin: 0 0 4px;
  font-weight: 400;
}
.docs-list .doc-created {
  opacity: 0.7;
  font-size: 14px;
}
</style>