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
import DashboardPageWrapper from '@/components/dashboard/layout/DashboardPageWrapper';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';

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
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <Label className="text-sm font-semibold break-words">{config.description || config.config_key}</Label>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{config.config_key}</p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
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
        className="p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors space-y-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Label className="text-sm font-semibold break-words">{config.description || config.config_key}</Label>
            <p className="text-xs text-muted-foreground font-mono truncate">{config.config_key}</p>
          </div>
          {changed && (
            <Button
              size="sm"
              className="self-end sm:self-auto shrink-0"
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
      <DashboardPageWrapper>
        <DashboardTitleCard
          title="Predefinições"
          subtitle="Configurações globais do sistema"
          icon={<Settings className="h-5 w-5" />}
          backTo="/dashboard"
        />
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper>
      <DashboardTitleCard
        title="Predefinições"
        subtitle="Gerencie todas as configurações da plataforma"
        icon={<Settings className="h-5 w-5" />}
        backTo="/dashboard"
        right={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchConfigs}>
              <RefreshCw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Recarregar</span>
            </Button>
            <Button size="sm" onClick={handleSaveAll} disabled={saving === 'all'}>
              {saving === 'all' ? (
                <Loader2 className="h-4 w-4 animate-spin sm:mr-1" />
              ) : (
                <Save className="h-4 w-4 sm:mr-1" />
              )}
              <span className="hidden sm:inline">Salvar Tudo</span>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue={categories[0] || 'general'} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 w-full">
          {categories.map((cat) => {
            const info = CATEGORY_LABELS[cat] || { label: cat, icon: <Settings className="h-4 w-4" /> };
            return (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1.5 text-xs sm:text-sm">
                {info.icon}
                <span className="hidden xs:inline">{info.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => {
          const info = CATEGORY_LABELS[cat] || { label: cat, icon: <Settings className="h-4 w-4" /> };
          return (
            <TabsContent key={cat} value={cat} className="mt-4">
              <Card>
                <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    {info.icon}
                    {info.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
                  {groupedConfigs[cat].map(renderConfigField)}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </DashboardPageWrapper>
  );
};

export default Predefinicoes;
