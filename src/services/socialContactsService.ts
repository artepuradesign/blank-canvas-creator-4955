import { apiRequest } from '@/config/api';

export interface SocialContacts {
  whatsapp_number: string;
  whatsapp_message: string;
  telegram_username: string;
  instagram_username: string;
  tiktok_username: string;
  whatsapp_enabled: boolean;
  telegram_enabled: boolean;
  instagram_enabled: boolean;
  tiktok_enabled: boolean;
}

const DEFAULTS: SocialContacts = {
  whatsapp_number: '5598981074836',
  whatsapp_message: 'Olá, pode me ajudar? Estou no site apipainel.com.br',
  telegram_username: 'apipainel_bot',
  instagram_username: 'apipainel',
  tiktok_username: 'apipainel',
  whatsapp_enabled: true,
  telegram_enabled: true,
  instagram_enabled: true,
  tiktok_enabled: true,
};

let cachedContacts: SocialContacts | null = null;

export const socialContactsService = {
  async getContacts(): Promise<SocialContacts> {
    if (cachedContacts) return cachedContacts;

    try {
      const response = await apiRequest<any>('/system-config-get.php?key=contact_whatsapp_number');
      
      // Se a API respondeu, buscar todos os contatos em paralelo
      const keys = [
        'contact_whatsapp_number',
        'contact_whatsapp_message',
        'contact_telegram_username',
        'contact_instagram_username',
        'contact_tiktok_username',
        'contact_whatsapp_enabled',
        'contact_telegram_enabled',
        'contact_instagram_enabled',
        'contact_tiktok_enabled',
      ];

      const results = await Promise.allSettled(
        keys.map(key => apiRequest<any>(`/system-config-get.php?key=${key}`))
      );

      const configMap: Record<string, string> = {};
      results.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value?.success && result.value?.data) {
          configMap[keys[i]] = result.value.data.config_value;
        }
      });

      const parseBool = (val: string | undefined, fallback: boolean) => {
        if (val === undefined) return fallback;
        return val === 'true' || val === '1';
      };

      cachedContacts = {
        whatsapp_number: configMap['contact_whatsapp_number'] || DEFAULTS.whatsapp_number,
        whatsapp_message: configMap['contact_whatsapp_message'] || DEFAULTS.whatsapp_message,
        telegram_username: configMap['contact_telegram_username'] || DEFAULTS.telegram_username,
        instagram_username: configMap['contact_instagram_username'] || DEFAULTS.instagram_username,
        tiktok_username: configMap['contact_tiktok_username'] || DEFAULTS.tiktok_username,
        whatsapp_enabled: parseBool(configMap['contact_whatsapp_enabled'], DEFAULTS.whatsapp_enabled),
        telegram_enabled: parseBool(configMap['contact_telegram_enabled'], DEFAULTS.telegram_enabled),
        instagram_enabled: parseBool(configMap['contact_instagram_enabled'], DEFAULTS.instagram_enabled),
        tiktok_enabled: parseBool(configMap['contact_tiktok_enabled'], DEFAULTS.tiktok_enabled),
      };

      console.log('✅ [SOCIAL] Contatos carregados da API:', cachedContacts);
      return cachedContacts;
    } catch (error) {
      console.warn('⚠️ [SOCIAL] Erro ao buscar contatos, usando fallback:', error);
      return DEFAULTS;
    }
  },

  clearCache() {
    cachedContacts = null;
  }
};
