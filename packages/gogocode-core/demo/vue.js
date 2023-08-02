const $ = require('../index');

const code = `<template>
<div v-loading.fullscreen.lock="loading" class="editor">
  <template v-if="!loading">
    <!-- 按钮部分 -->
    <editor-header :formPageId="formPageId"></editor-header>
    <!-- 主题内容部分 -->
    <div class="editor__main">
      <editor-store class="editor__main__left"> </editor-store>
      <div class="editor__main__center">
        <editor-container-header></editor-container-header>
        <editor-container></editor-container>
      </div>
      <editor-attributes class="editor__main__right"></editor-attributes>
    </div>
  </template>
  <editor-modal></editor-modal>
</div>
</template>

<script lang="ts" >
import { defineComponent, onMounted, ref, nextTick } from 'vue';
import store from '@/store';
import { getPageInfo } from '@/api';
import { restoreEditCompMappingsByJSON, restoreEditCompMappingByJSON } from '@/EditCompMapping/composable';
import router from '@/router';
import { replaceJsonAcrossVersion, globalRules } from '@lowcode/data-compatibility';
import { EditorPageController } from '@lowcode/editor-material-controller/src/EditorPageController';
import EditCommonMapping from '@/EditCompMapping/EditCommonMapping';
import { DATA_VERSION } from '@/config';
import EditorStore from './editor-store/index.vue';
import EditorAttributes from './editor-attributes.vue';
import EditorContainerHeader from './editor-container-header/index';
import EditorContainer from './editor-components/index.vue';
import EditorModal from './editor-modal';
import EditorHeader from './editor-header.vue';
import { initPageFlow } from '../composable/page-flow';

export default defineComponent({
components: {
  EditorHeader,
  EditorStore,
  EditorAttributes,
  EditorContainer,
  EditorContainerHeader,
  EditorModal,
},
setup() {
  const loading = ref(true);
  const formPageId = ref('');
  const initPage = async () => {
    const editorPageMapping = new EditorPageController({});
    editorPageMapping.name = '页面信息';
    store.commit('setPageSetting', await restoreEditCompMappingByJSON(new EditCommonMapping(editorPageMapping)));

    const res = (await getPageInfo(formPageId.value)) as any;
    if (res.data) {
      const { componentMappingJSONs, pageSetting } = replaceJsonAcrossVersion(
        JSON.parse(res.data),
        DATA_VERSION,
        globalRules,
      );

      if (componentMappingJSONs) {
        const editCompMappings = await restoreEditCompMappingsByJSON(componentMappingJSONs);
        store.commit('setEditCompMappings', editCompMappings);
      }
      if (pageSetting) {
        store.commit('setPageSetting', await restoreEditCompMappingByJSON(pageSetting));
      }
    }
  };

  onMounted(async function () {
    /** 页面返回后，vuex存在数据残留，导致属性显示不正确，重置vuex中的state */
    await store.dispatch('resetStoreState');

    if (router.currentRoute.query.id) {
      formPageId.value = router.currentRoute.query.id.toString();
    }

    if (router.currentRoute.query.businessAppId) {
      store.commit('setBusinessAppId', router.currentRoute.query.businessAppId.toString());
    }
    await initPageFlow();
    await initPage();
    await nextTick();

    loading.value = false;
  });

  return {
    loading,
    formPageId,
  };
},
});
</script>

<style lang="less">
@import './index.less';
</style>

`;

const res = $(code, {
    parseOptions: {
        language: 'vue',
    },
})
    .find(`<script></script>`)
    .generate();

console.log(res);
