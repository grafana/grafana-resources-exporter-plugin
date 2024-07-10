import React, { useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { css } from '@emotion/css';
import { GrafanaTheme2, KeyValue, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Field, FieldSet, Input, SecretInput, useStyles2 } from '@grafana/ui';
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


  return (
    <div>
      <FieldSet label="API Settings">
        <Field label="Grafana Url" description="" className={s.marginTop}>
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

        <Field label="Service Account Token" description={<a rel="noreferrer" target='_blank' href={serviceAccountURL}>Create one here: {serviceAccountURL}</a>}>
          <SecretInput
            placeholder={'Your service account token'}
            {...baseSecretInputProps('grafanaServiceAccountToken')}
          />
        </Field>

        <Field label="SM Url" description={<a rel="noreferrer" target='_blank' href={smURL}>Find it here: {smURL}</a>} className={s.marginTop}>
          <Input
            width={60}
            placeholder={`E.g.: https://my-sm-instance.com`}
            {...baseInputProps('smUrl')}
          />
        </Field>

        <Field label="SM Token" description={<a rel="noreferrer" target='_blank' href={smURL}>Create one here: {smURL}</a>}>
          <SecretInput
            placeholder={'Your SM token'}
            {...baseSecretInputProps('smToken')}
          />
        </Field>

        <Field label="Oncall Url" description={<a rel="noreferrer" target='_blank' href={oncallURL}>Find it here: {oncallURL}</a>} className={s.marginTop}>
          <Input
            width={60}
            placeholder={`E.g.: https://my-oncall-instance.com`}
            {...baseInputProps('oncallUrl')}
          />
        </Field>

        <Field label="Oncall Token" description={<a rel="noreferrer" target='_blank' href={oncallURL}>Create one here: {oncallURL}</a>}>
          <SecretInput
            placeholder={'Your oncall token'}
            {...baseSecretInputProps('oncallToken')}
          />
        </Field>

        <Field label="Cloud Org" description="" className={s.marginTop}>
          <Input
            width={60}
            placeholder={`E.g.: my-cloud-org`}
            {...baseInputProps('cloudOrg')}
          />
        </Field>

        <Field label="Cloud Access Policy Token" description="">
          <SecretInput
            placeholder={'Access policy token'}
            {...baseSecretInputProps('cloudAccessPolicyToken')}
          />
        </Field>

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
