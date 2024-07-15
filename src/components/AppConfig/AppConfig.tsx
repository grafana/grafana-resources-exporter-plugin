import React, { useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { css } from '@emotion/css';
import { GrafanaTheme2, KeyValue, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Field, FieldSet, Input, SecretInput, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { ExporterPluginConfigPageProps, ExporterPluginMetaJSONData, ExporterPluginMetaSecureJSONData } from 'types/pluginData';


type State = {
  jsonData: ExporterPluginMetaJSONData;
  secureJsonData: ExporterPluginMetaSecureJSONData;
  secureJsonDataSet: KeyValue<boolean>;
};

interface Props extends ExporterPluginConfigPageProps { }

export const AppConfig = ({ plugin }: Props) => {
  const currentHost = window.location.protocol + '//' + window.location.host;

  const s = useStyles2(getStyles);
  const { enabled, pinned, jsonData, secureJsonFields } = plugin.meta;
  const [state, setState] = useState<State>({
    jsonData: jsonData || {
      grafanaUrl: currentHost,
      grafanaIsCloudStack: false,
      smUrl: '',
      oncallUrl: '',
      cloudOrg: '',
      initialized: false,
    },
    secureJsonData: {
      grafanaServiceAccountToken: '',
      smToken: '',
      oncallToken: '',
      cloudAccessPolicyToken: '',
    },
    secureJsonDataSet: secureJsonFields || {},
  });
  const [tabs, setTabs] = useState([
    { label: 'Grafana', active: true },
    { label: 'Synthetic Monitoring', active: false },
    { label: 'OnCall', active: false },
    { label: 'Cloud', active: false },
  ]);

  const serviceAccountURL = state.jsonData.grafanaUrl + '/org/serviceaccounts';
  const smURL = state.jsonData.grafanaUrl + '/a/grafana-synthetic-monitoring-app/config';
  const oncallURL = state.jsonData.grafanaUrl + '/a/grafana-oncall-app/settings';


  function baseInputProps<T>(key: keyof ExporterPluginMetaJSONData) {
    return {
      id: "config-" + key,
      name: key as string,
      value: state.jsonData[key] as T,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setState({
          ...state,
          jsonData: {
            ...state.jsonData,
            [event.target.name]: event.target.value,
          },
        })
      },
    }
  }

  function baseSecretInputProps(key: keyof ExporterPluginMetaSecureJSONData) {
    return {
      id: "config-" + key,
      name: key as string,
      width: 60,
      value: state.secureJsonData[key],
      isConfigured: state.secureJsonDataSet[key],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setState({
          ...state,
          secureJsonData: {
            ...state.secureJsonData,
            [event.target.name]: event.target.value,
          },
        });
      },
      onReset: () => {
        setState({
          ...state,
          secureJsonData: {
            ...state.secureJsonData,
            [key]: '',
          },
          secureJsonDataSet: {
            ...state.secureJsonDataSet,
            [key]: false,
          }
        });
      },
    };
  }

  const linkButton = (url: string, text: string) => <Button variant="secondary" onClick={() => window.open(url, '_blank')}>{text}</Button>;
  return (
    <div>
      <FieldSet label="API Settings">
        <TabsBar>
          {tabs.map((tab, index) => {
            return <Tab key={index} label={tab.label} active={tab.active} onChangeTab={() => setTabs(tabs.map((tab, idx) => ({
              ...tab,
              active: idx === index
            })))} />;
          })}
        </TabsBar>
        <TabContent>
          {tabs[0].active && <>
            <Field label="Grafana Url" className={s.marginTop}>
              <Input
                width={60}
                placeholder={`E.g.: https://my-grafana-instance.com`}
                {...baseInputProps('grafanaUrl')}
                addonAfter={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setState({
                        ...state,
                        jsonData: {
                          ...state.jsonData,
                          grafanaUrl: currentHost,
                        },
                      });
                    }}
                  >
                    Reset
                  </Button>
                }
              />
            </Field>

            <Field label="Service Account Token">
              <SecretInput
                placeholder={'Your service account token'}
                {...baseSecretInputProps('grafanaServiceAccountToken')}
                addonAfter={!state.secureJsonDataSet['grafanaServiceAccountToken'] ? linkButton(serviceAccountURL, "Create") : <></>}
              />
            </Field>
          </>}
          {tabs[1].active && <>
            <Field label="SM Url" className={s.marginTop}>
              <Input
                width={60}
                {...baseInputProps('smUrl')}
                addonAfter={linkButton(smURL, "Get from SM")}
              />
            </Field>

            <Field label="SM Token">
              <SecretInput
                {...baseSecretInputProps('smToken')}
                addonAfter={!state.secureJsonDataSet['smToken'] ? linkButton(smURL, "Get from SM") : <></>}
              />
            </Field>
          </>}
          {tabs[2].active && <>
            <Field label="Oncall Url" className={s.marginTop}>
              <Input
                width={60}
                {...baseInputProps('oncallUrl')}
                addonAfter={linkButton(oncallURL, "Get from Oncall")}
              />
            </Field>

            <Field label="Oncall Token">
              <SecretInput
                {...baseSecretInputProps('oncallToken')}
                addonAfter={!state.secureJsonDataSet['oncallToken'] ? linkButton(oncallURL, "Get from Oncall") : <></>}
              />
            </Field>
          </>}
          {tabs[3].active && <>
            <Field label="Cloud Org" className={s.marginTop}>
              <Input
                width={60}
                {...baseInputProps('cloudOrg')}
              />
            </Field>

            <Field label="Cloud Access Policy Token">
              <SecretInput
                {...baseSecretInputProps('cloudAccessPolicyToken')}
              />
            </Field>
          </>}
        </TabContent>

        <div className={s.marginTop}>
          <Button
            type="submit"
            onClick={() => {
              return updatePluginAndReload(plugin.meta.id, {
                enabled,
                pinned,
                jsonData: {
                  ...state.jsonData,
                  initialized: true,
                  // TODO: This doesn't work for custom stack URLs. Find a better way.
                  grafanaIsCloudStack:
                    state.jsonData.grafanaUrl.includes('.grafana.net') ||
                    state.jsonData.grafanaUrl.includes('.grafana-dev.net') ||
                    state.jsonData.grafanaUrl.includes('.grafana-ops.net'),
                },
                // This cannot be queried later by the frontend.
                // We don't want to override it in case it was set previously and left untouched now.
                secureJsonData: state.secureJsonData,
              })
            }
            }
          >
            Save API settings
          </Button>
        </div>
      </FieldSet >
    </div >
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  colorWeak: css`
    color: ${theme.colors.text.secondary};
  `,
  marginTop: css`
    margin-top: ${theme.spacing(3)};
  `,
});

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta<ExporterPluginMetaJSONData>>) => {
  try {
    await updatePlugin(pluginId, data);

    // Reloading the page as the changes made here wouldn't be propagated to the actual plugin otherwise.
    // This is not ideal, however unfortunately currently there is no supported way for updating the plugin state.
    window.location.reload();
  } catch (e) {
    console.error('Error while updating the plugin', e);
  }
};

export const updatePlugin = async (pluginId: string, data: Partial<PluginMeta>) => {
  const response = await getBackendSrv().fetch({
    url: `/api/plugins/${pluginId}/settings`,
    method: 'POST',
    data,
  });

  return lastValueFrom(response);
};
