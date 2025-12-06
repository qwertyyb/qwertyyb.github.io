<template>
  <div class="docs-list">
    <img src="https://cn.bing.com/th?id=OHR.CopanRuins_EN-US5517813382_UHD.jpg&rf=LaDigue_UHD.jpg&pid=hp&w=3840&h=2160&rs=1&c=4" alt="" class="cover">
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
.docs-list .cover {
  width: 100%;
  height: 50vh;
  object-fit: cover;
}
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
  border-top: 1px solid #bbb;
}
.docs-list .item {
  transition: all .2s;
}
.docs-list .item:hover {
  color: var(--vp-c-brand-1);
}
.docs-list .doc-title {
  font-size: 22px;
  margin: 0 0 4px;
  font-weight: 400;
}
.docs-list .doc-created {
  opacity: 0.7;
  font-size: 14px;
}
</style>