
import React from 'react';
import { useHereMapsSettings } from './here-maps/useHereMapsSettings';
import { HereMapsConfiguration } from './here-maps/HereMapsConfiguration';
import { JamaicaOptimization } from './here-maps/JamaicaOptimization';

export const HereMapsSettings: React.FC = () => {
  const {
    config,
    isLoading,
    isTesting,
    error,
    saveConfig,
    testConnection,
    handleApiKeyChange
  } = useHereMapsSettings();

  if (isLoading && !config.isConfigured) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HereMapsConfiguration
        config={config}
        isLoading={isLoading}
        isTesting={isTesting}
        error={error}
        onApiKeyChange={handleApiKeyChange}
        onSave={saveConfig}
        onTest={testConnection}
      />
      
      <JamaicaOptimization />
    </div>
  );
};
