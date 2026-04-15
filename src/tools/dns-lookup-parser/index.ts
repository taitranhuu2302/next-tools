import { Network } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.dns-lookup-parser.title')),
  path: '/dns-lookup-parser',
  key: 'dns-lookup-parser',
  description: computed(() => translate('tools.dns-lookup-parser.description')),
  keywords: computed(() => translate('tools.dns-lookup-parser.keywords')),
  component: () => import('./dns-lookup-parser.vue'),
  icon: Network,
  createdAt: new Date('2026-04-15'),
})
