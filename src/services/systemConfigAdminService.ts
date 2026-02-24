import { getApiUrl } from '@/config/api';
import { getAuthHeaders } from '@/config/apiConfig';

export interface SystemConfigItem {
  config_key: string;
  config_value: any;
  config_type: string;
  category: string;
  description: string;
  is_public: boolean;
}

export const systemConfigAdminService = {
  async getAllConfigs(category?: string): Promise<SystemConfigItem[]> {
    const url = getApiUrl(`/system-config/get${category ? `?category=${category}` : ''}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Erro ao buscar configurações');
  },

  async updateConfig(config_key: string, config_value: string, config_type?: string): Promise<void> {
    const url = getApiUrl('/system-config/update');
    const body: any = { config_key, config_value };
    if (config_type) body.config_type = config_type;

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Erro ao atualizar configuração');
    }
  },
};
