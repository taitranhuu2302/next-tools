import { FileJson2 } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.typescript-to-json.title')),
  path: '/typescript-to-json',
  key: 'typescript-to-json',
  description: computed(() => translate('tools.typescript-to-json.description')),
  keywords: computed(() => translate('tools.typescript-to-json.keywords')),
  component: () => import('./typescript-to-json.vue'),
  icon: FileJson2,
  createdAt: new Date('2026-04-15'),
})
