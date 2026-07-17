<script setup>
import { computed } from 'vue';
import { ElAvatar } from 'element-plus';

const props = defineProps({
  /** 用户 ID(用于计算头像 URL /avatars/{id}.png) */
  userId: { type: [Number, String], default: null },
  /** 直接指定头像 URL,优先级高于 userId */
  src: { type: String, default: '' },
  /** 用户名/展示名(用于计算首字母 fallback + 稳定色) */
  name: { type: String, default: '' },
  /** 尺寸 */
  size: { type: [Number, String], default: 36 },
});

const url = computed(() => {
  if (props.src) return props.src;
  if (props.userId != null && props.userId !== '') {
    return `/avatars/${props.userId}.png`;
  }
  return '';
});

const initial = computed(() => {
  const name = props.name || String(props.userId ?? '');
  return (name || '?').trim().slice(0, 1).toUpperCase();
});

/** 基于名字/id 的稳定颜色 */
const bgColor = computed(() => {
  const palette = ['#5b8def', '#f4b400', '#0f9d58', '#db4437', '#9c27b0', '#00acc1', '#ff7043'];
  const key = String(props.name || props.userId || '?');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) & 0xffffffff;
  }
  return palette[Math.abs(hash) % palette.length];
});
</script>

<template>
  <!--
    el-avatar 图片加载失败(404 等)会自动 fallback 到 slot 内容;
    我们把 slot 里放首字母 + 稳定色,达到"绝不出现破图"的效果。
  -->
  <el-avatar
    :size="size"
    :src="url || undefined"
    :style="{ backgroundColor: bgColor, color: '#fff', fontWeight: 600 }"
  >
    {{ initial }}
  </el-avatar>
</template>
