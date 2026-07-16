<template>
  <el-button type="primary" @click="uploadArticle">上传文章</el-button>
  <el-button type="primary" @click="toggleMdMode">{{ mdMode ? '切换为 HTML 模式' : '转换为 MD 语法' }}</el-button>
  <div class="editor-container">
    <div ref="editorContainer" class="editor"></div>
    <div class="preview" v-html="previewHtml"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import wangEditor from 'wangeditor';
import { marked } from 'marked';
import { ElMessage } from 'element-plus';
import { upload } from '../api/CreatPart';

const editorContainer = ref(null);
const previewHtml = ref('');
let editor = null;
const mdMode = ref(false);

onMounted(() => {
  editor = new wangEditor(editorContainer.value);
  editor.config.fullScreen = true;

  editor.config.onchange = () => {
    const content = editor.txt.html();
    if (mdMode.value) {
      const markdownContent = content
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<br\s*\/?>/g, '\n');
      previewHtml.value = marked.parse(markdownContent);
    } else {
      previewHtml.value = content;
    }
  };

  editor.create();
});

// 上传文章
const uploadArticle = async () => {
  const content = editor.txt.html();
  const markdownContent = mdMode.value ? content.replace(/<[^>]+>/g, '') : content;
  const htmlContent = marked.parse(markdownContent);

  try {
    await upload({ content: htmlContent });
    ElMessage.success('发布成功');
  } catch (err) {
    console.error('[Create] upload failed:', err);
  }
};

// 切换 Markdown 模式
const toggleMdMode = () => {
  // const content = editor.txt.html(); // 获取当前 HTML 内容

  //   if (mdMode.value) {
  //       // 如果当前是 Markdown 模式，切换为 HTML 模式
  //       mdMode.value = false;
  //   } else {
  //       // 如果当前是 HTML 模式，切换为 Markdown 模式
  //       // 将 HTML 转换为 Markdown
  //       const markdownContent = content
  //           .replace(/<p>(.*?)<\/p>/g, '$1\n\n') // 将段落转换为 Markdown
  //           .replace(/<br\s*\/?>/g, '\n'); // 将 <br> 替换为换行符
  //             console.log(markdownContent);
              
  //       editor.txt.html(markdownContent); // 更新编辑器内容为 Markdown
  //       mdMode.value = true; // 切换为 Markdown 模式
  //   }
  confirm ('记得保存内容')
  editor.txt.html('')
  mdMode.value = !mdMode.value; // 切换模式
};

</script>

<style scoped>
.editor-container {
  display: flex;
  height: 100vh;
  text-align: left; /* 段落文字左对齐 */
}

.editor {
  flex: 1;
  border-right: 1px solid #ccc;
  padding: 10px;
}

.preview {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #f9f9f9;
}
</style>