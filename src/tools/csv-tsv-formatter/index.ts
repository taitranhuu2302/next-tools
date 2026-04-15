import { Table2 } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.csv-tsv-formatter.title')),
  path: '/csv-tsv-formatter',
  key: 'csv-tsv-formatter',
  description: computed(() => translate('tools.csv-tsv-formatter.description')),
  keywords: computed(() => translate('tools.csv-tsv-formatter.keywords')),
  component: () => import('./csv-tsv-formatter.vue'),
  icon: Table2,
  createdAt: new Date('2026-04-15'),
})
