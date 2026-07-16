<script setup>
import { ref, onMounted } from 'vue';
import CommentItem from '@/components/CommentItem.vue';
import { commentAcquire } from '../api/CommentPart';
import { useScroll } from '@/composables/useScroll';

const commentData = ref([]);
const loading = ref(true);
const isFixed = ref(false);

onMounted(async () => {
  try {
    // Phase 3 会重新设计评论接口;当前保留旧行为
    const list = await commentAcquire({ userName: 'aq1' });
    commentData.value = Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[CommentPart] fetch failed:', err);
  } finally {
    loading.value = false;
  }
});

// useScroll 自带清理,不会泄漏
useScroll(({ scrollTop }) => {
  isFixed.value = scrollTop > 300;
});

//评论 tab
const selectLight = ref(0);
</script>

<template>
<el-row :gutter="6">
    <el-col :lg="14" class="left-col">
        <div class="nav" :class="{ fixed:isFixed }">
            <span class="one" :class=" {'light':selectLight==0}" @click="selectLight=0">热门</span>
            <span class="two" :class="{'light':selectLight==1}" @click="selectLight=1">最新</span>
        </div>
        <div class="content" >
            <CommentItem class="comment" v-for="(item, index) in commentData" :key="item.id ?? index" :time="item.time" :userName="item.userName" :like="item.like" :content="item.content" />
        </div>
    </el-col>
    <el-col :lg="4" class="right-col">
        <ul class="side">
            <p>公告栏</p>
            <div class="side1"></div>
        </ul>
        <ul class="side">
            <p>智小圈</p>
            <div class="side2"></div>
        </ul>
    </el-col>
  </el-row>
</template>

<style scoped>
.el-col {
  border-radius: 4px;
  height: 1500px;
}

.el-col.left-col{
  margin-left: 7vw;
}

.nav {
  display: flex;
  flex-direction: row;
  height: 48px;
  justify-content: left; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  border-bottom: 1px solid  hsl(0, 0%, 84%);
  transition: top .2s;
  z-index:10;
  background-color: #fff;
}

.nav.fixed {
    position: fixed;
    top:0;
    width: 57.5%;
}

.one{
  color: #a9a9a9;
  display: inline-block;
  font-size: 18px;
  margin-left: 25px;
  margin-right: 40px;
}

.two{
  display: inline-block;
  font-size: 18px;
  color: #a9a9a9;
} 

.one,
.two{
    float:left;
    transition: color 0.3s ease;
    cursor: default;
    font-weight: 500;
}

.light{
    color: rgb(30,128,255);
    position: relative;
    padding-bottom: 4px;
}

.light::after{
    content: "";
    position: absolute;
    bottom: 0.5px;
    left: 50%;
    margin-left: -7px;
    width: 14px; /* 蓝色条的宽度 */
    height: 2px; /* 蓝色条的高度 */
    background-color: rgb(30,128,255); /* 蓝色条的颜色 */
}

.comment{
  background-color: #fff;
  margin-top:10px;
}

.el-col.right-col{
  margin-left: 1.5vw;
}

.side {
    min-height: 320px;
    background-color: #fff;
    flex: 1;
    padding: 0;
    margin-bottom: 70px;
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5);
}   

p {
    font-weight: 500;
    font-size: 1.34rem;
    padding: 1rem;
}

.side1,
.side2 {
    border-top:1px solid rgba(0, 0, 0, .2);
}
</style>