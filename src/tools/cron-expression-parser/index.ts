import { List } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.cron-expression-parser.title')),
  path: '/cron-expression-parser',
  key: 'cron-expression-parser',
  description: computed(() => translate('tools.cron-expression-parser.description')),
  keywords: computed(() => translate('tools.cron-expression-parser.keywords')),
  component: () => import('./cron-expression-parser.vue'),
  icon: List,
  createdAt: new Date('2026-04-15'),
})
