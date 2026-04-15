import { ShieldCheck } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.json-schema-validator.title')),
  path: '/json-schema-validator',
  key: 'json-schema-validator',
  description: computed(() => translate('tools.json-schema-validator.description')),
  keywords: computed(() => translate('tools.json-schema-validator.keywords')),
  component: () => import('./json-schema-validator.vue'),
  icon: ShieldCheck,
  createdAt: new Date('2026-04-15'),
})
