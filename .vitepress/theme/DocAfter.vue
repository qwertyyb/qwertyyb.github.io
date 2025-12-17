<template>
  <div class="doc-after">
    <ul class="doc-pagination">
      <li class="doc prev-page">
        <a :href="withBase(cur.prev.url)" class="page-link prev" v-if="cur?.prev">
          <span class="desc">上一篇</span>
          <span class="title">{{ cur.prev.title }}</span>
        </a>
      </li>
      <li class="doc next-page">
        <a :href="withBase(cur.next.url)" class="page-link next" v-if="cur?.next">
          <span class="desc">下一篇</span>
          <span class="title">{{ cur.next.title }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { inject, computed } from 'vue';
import { useRoute, withBase } from 'vitepress';
import type { data } from './docs.data.ts'

const route = useRoute();

const docs = inject<typeof data>('docs', [])

const cur = computed(() => docs.find(item => item.url === decodeURI(route.path)))
</script>

<style lang="scss" scoped>
.doc-pagination {
  border-top: 1px solid var(--vp-c-divider);
  grid-row-gap: 8px;
  padding-top: 24px;
  display: grid;
}
@media (min-width: 640px) {
  .doc-pagination {
    grid-column-gap: 16px;
    grid-template-columns: repeat(2, 1fr);
  }
}
.page-link {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  width: 100%;
  height: 100%;
  padding: 11px 16px 13px;
  transition: border-color .25s;
  display: block;
  &:hover {
    border-color: var(--vp-c-brand-1);
  }
}
.desc {
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  display: block;
}
.title {
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  transition: color .25s;
  display: block;
}
</style>

<style>
[dir="ltr"] .page-link.next {
  text-align: right;
}
</style>