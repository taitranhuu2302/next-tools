import { Globe2 } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.api-client.title')),
  path: '/api-client',
  key: 'api-client',
  description: computed(() => translate('tools.api-client.description')),
  keywords: computed(() => translate('tools.api-client.keywords')),
  component: () => import('./api-client.vue'),
  icon: Globe2,
  createdAt: new Date('2026-04-15'),
})
