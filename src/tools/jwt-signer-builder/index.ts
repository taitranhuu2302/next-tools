import { PenTool } from 'lucide-vue-next';
import { computed } from 'vue';
import { translate } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: computed(() => translate('tools.jwt-signer-builder.title')),
  path: '/jwt-signer-builder',
  key: 'jwt-signer-builder',
  description: computed(() => translate('tools.jwt-signer-builder.description')),
  keywords: computed(() => translate('tools.jwt-signer-builder.keywords')),
  component: () => import('./jwt-signer-builder.vue'),
  icon: PenTool,
  createdAt: new Date('2026-04-15'),
})
