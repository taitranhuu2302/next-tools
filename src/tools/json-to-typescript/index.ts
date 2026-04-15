import { FileCode2 } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.json-to-typescript.title')),
  path: '/json-to-typescript',
  key: 'json-to-typescript',
  description: computed(() => translate('tools.json-to-typescript.description')),
  keywords: computed(() => translate('tools.json-to-typescript.keywords')),
  component: () => import('./json-to-typescript.vue'),
  icon: FileCode2,
  createdAt: new Date('2026-04-15'),
})
