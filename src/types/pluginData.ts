import { AppRootProps as BaseAppRootProps, AppPluginMeta, PluginConfigPageProps } from '@grafana/data';


export type ExporterPluginMetaJSONData = {
    grafanaUrl: string;
    grafanaIsCloudStack: boolean;
    smUrl: string;
    oncallUrl: string;
    cloudOrg: string;
    initialized: boolean;
};

export type ExporterPluginMetaSecureJSONData = {
    grafanaServiceAccountToken?: string;
    smToken?: string;
    oncallToken?: string;
    cloudAccessPolicyToken?: string;
};

export type AppRootProps = BaseAppRootProps<ExporterPluginMetaJSONData>;

export type ExporterAppPluginMeta = AppPluginMeta<ExporterPluginMetaJSONData>;
export type ExporterPluginConfigPageProps = PluginConfigPageProps<ExporterAppPluginMeta>;


