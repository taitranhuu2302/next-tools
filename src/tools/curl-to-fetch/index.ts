import { Code } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.curl-to-fetch.title')),
  path: '/curl-to-fetch',
  key: 'curl-to-fetch',
  description: computed(() => translate('tools.curl-to-fetch.description')),
  keywords: computed(() => translate('tools.curl-to-fetch.keywords')),
  component: () => import('./curl-to-fetch.vue'),
  icon: Code,
  createdAt: new Date('2026-04-15'),
})
