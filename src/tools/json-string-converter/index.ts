import { Braces } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.json-string-converter.title')),
  path: '/json-string-converter',
  key: 'json-string-converter',
  description: computed(() => translate('tools.json-string-converter.description')),
  keywords: computed(() => translate('tools.json-string-converter.keywords')),
  component: () => import('./json-string-converter.vue'),
  icon: Braces,
  createdAt: new Date('2026-04-15'),
})
