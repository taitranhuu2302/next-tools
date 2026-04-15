import { Table } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.csv-to-json.title')),
  path: '/csv-to-json',
  key: 'csv-to-json',
  description: computed(() => translate('tools.csv-to-json.description')),
  keywords: computed(() => translate('tools.csv-to-json.keywords')),
  component: () => import('./csv-to-json.vue'),
  icon: Table,
  createdAt: new Date('2026-04-15'),
})
