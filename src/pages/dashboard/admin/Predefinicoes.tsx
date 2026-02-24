import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Settings, Save, Loader2, Globe, MessageCircle, Shield, DollarSign, Users, RefreshCw } from 'lucide-react';
import { systemConfigAdminService, SystemConfigItem } from '@/services/systemConfigAdminService';

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  general: { label: 'Geral', icon: <Globe className="h-4 w-4" /> },
  social: { label: 'Redes Sociais', icon: <MessageCircle className="h-4 w-4" /> },
  system: { label: 'Sistema', icon: <Settings className="h-4 w-4" /> },
  security: { label: 'Segurança', icon: <Shield className="h-4 w-4" /> },
  financial: { label: 'Financeiro', icon: <DollarSign className="h-4 w-4" /> },
  referral: { label: 'Indicações', icon: <Users className="h-4 w-4" /> },
};

const Predefinicoes = () => {
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await systemConfigAdminService.getAllConfigs();
      setConfigs(data);
      const initial: Record<string, string> = {};
      data.forEach((c) => {
        initial[c.config_key] = String(c.config_value);
      });
      setEditedValues(initial);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (key: string, type: string) => {
    setSaving(key);
    try {
      await systemConfigAdminService.updateConfig(key, editedValues[key], type);
      toast.success(`Configuração "${key}" atualizada com sucesso!`);
      // Atualizar o valor original no state
      setConfigs((prev) =>
        prev.map((c) =>
          c.config_key === key ? { ...c, config_value: editedValues[key] } : c
        )
      );
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    const changed = configs.filter(
      (c) => String(c.config_value) !== editedValues[c.config_key]
    );
    if (changed.length === 0) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }
    setSaving('all');
    try {
      for (const c of changed) {
        await systemConfigAdminService.updateConfig(
          c.config_key,
          editedValues[c.config_key],
          c.config_type
        );
      }
      toast.success(`${changed.length} configuração(ões) atualizada(s)!`);
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setSaving(null);
    }
  };

  const groupedConfigs = configs.reduce<Record<string, SystemConfigItem[]>>((acc, config) => {
    const cat = config.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(config);
    return acc;
  }, {});

  const categories = Object.keys(groupedConfigs);

  const isChanged = (key: string) => {
    const original = configs.find((c) => c.config_key === key);
    return original && String(original.config_value) !== editedValues[key];
  };

  const renderConfigField = (config: SystemConfigItem) => {
    const value = editedValues[config.config_key] ?? '';
    const changed = isChanged(config.config_key);

    if (config.config_type === 'boolean') {
      return (
        <div
          key={config.config_key}
          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
        >
          <div className="flex-1">
            <Label className="text-sm font-semibold">{config.description || config.config_key}</Label>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{config.config_key}</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={value === 'true' || value === '1'}
              onCheckedChange={(checked) => {
                setEditedValues((prev) => ({
                  ...prev,
                  [config.config_key]: checked ? 'true' : 'false',
                }));
              }}
            />
            {changed && (
              <Button
                size="sm"
                onClick={() => handleSave(config.config_key, config.config_type)}
                disabled={saving === config.config_key}
              >
                {saving === config.config_key ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        key={config.config_key}
        className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">{config.description || config.config_key}</Label>
            <p className="text-xs text-muted-foreground font-mono">{config.config_key}</p>
          </div>
          {changed && (
            <Button
              size="sm"
              onClick={() => handleSave(config.config_key, config.config_type)}
              disabled={saving === config.config_key}
            >
              {saving === config.config_key ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Salvar
            </Button>
          )}
        </div>
        <Input
          value={value}
          onChange={(e) =>
            setEditedValues((prev) => ({
              ...prev,
              [config.config_key]: e.target.value,
            }))
          }
          type={config.config_type === 'number' ? 'number' : 'text'}
          className={changed ? 'border-primary ring-1 ring-primary/20' : ''}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Predefinições do Sistema
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie todas as configurações da plataforma em um só lugar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchConfigs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Recarregar
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={saving === 'all'}>
            {saving === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Salvar Tudo
          </Button>
        </div>
      </div>

      {/* Tabs por categoria */}
      <Tabs defaultValue={categories[0] || 'general'} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {categories.map((cat) => {
            const info = CATEGORY_LABELS[cat] || { label: cat, icon: <Settings className="h-4 w-4" /> };
            return (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1.5 text-xs sm:text-sm">
                {info.icon}
                {info.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => {
          const info = CATEGORY_LABELS[cat] || { label: cat, icon: <Settings className="h-4 w-4" /> };
          return (
            <TabsContent key={cat} value={cat} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {info.icon}
                    {info.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groupedConfigs[cat].map(renderConfigField)}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Predefinicoes;
