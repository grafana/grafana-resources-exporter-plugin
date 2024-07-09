import { AppPlugin } from '@grafana/data';
import { App } from './components/App';
import { AppConfig } from './components/AppConfig';
import { ExporterPluginMetaJSONData } from 'types/pluginData';

export const plugin = new AppPlugin<ExporterPluginMetaJSONData>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: AppConfig,
  id: 'configuration',
});
