<template>
  <div class="doc-before vp-doc">
    <h1>{{ page.title }}</h1>
  </div>
</template>

<script lang="ts" setup>
import { useData } from 'vitepress';

const { page } = useData();
</script>