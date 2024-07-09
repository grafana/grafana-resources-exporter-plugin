import React, { useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { css } from '@emotion/css';
import { GrafanaTheme2, KeyValue, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Checkbox, Field, FieldSet, Input, SecretInput, useStyles2 } from '@grafana/ui';
import { ExporterPluginConfigPageProps, ExporterPluginMetaJSONData, ExporterPluginMetaSecureJSONData } from 'types/pluginData';


type State = {
  jsonData: ExporterPluginMetaJSONData;
  secureJsonData: ExporterPluginMetaSecureJSONData;
  secureJsonDataSet: KeyValue<boolean>;
};

interface Props extends ExporterPluginConfigPageProps { }

export const AppConfig = ({ plugin }: Props) => {
  const s = useStyles2(getStyles);
  const { enabled, pinned, jsonData, secureJsonFields } = plugin.meta;
  const [state, setState] = useState<State>({
    jsonData: jsonData || {
      grafanaUrl: '',
      grafanaIsCloudStack: false,
      smUrl: '',
      oncallUrl: '',
      cloudOrg: '',
    },
    secureJsonData: {
      grafanaServiceAccountToken: '',
      smToken: '',
      oncallToken: '',
      cloudAccessPolicyToken: '',
    },
    secureJsonDataSet: secureJsonFields || {},
  });

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
          />
        </Field>

        <Field label="Is Cloud Stack" description="Is this a cloud stack?">
          <Checkbox label="Is Cloud Stack"
            name="grafanaIsCloudStack"
            checked={state.jsonData.grafanaIsCloudStack}
            onChange={(event) => {
              setState({
                ...state,
                jsonData: {
                  ...state.jsonData,
                  grafanaIsCloudStack: event.currentTarget.checked,
                },
              });
            }}
          />
        </Field>

        <Field label="Service Account Token" description="A service account token.">
          <SecretInput
            placeholder={'Your service account token'}
            {...baseSecretInputProps('grafanaServiceAccountToken')}
          />
        </Field>

        <Field label="SM Url" description="" className={s.marginTop}>
          <Input
            width={60}
            placeholder={`E.g.: https://my-sm-instance.com`}
            {...baseInputProps('smUrl')}
          />
        </Field>

        <Field label="SM Token" description="">
          <SecretInput
            placeholder={'Your SM token'}
            {...baseSecretInputProps('smToken')}
          />
        </Field>

        <Field label="Oncall Url" description="" className={s.marginTop}>
          <Input
            width={60}
            placeholder={`E.g.: https://my-oncall-instance.com`}
            {...baseInputProps('oncallUrl')}
          />
        </Field>

        <Field label="Oncall Token" description="">
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
                jsonData: state.jsonData,
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
