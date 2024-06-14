import React, { ChangeEvent, useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { css } from '@emotion/css';
import { AppPluginMeta, GrafanaTheme2, KeyValue, PluginConfigPageProps, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Checkbox, Field, FieldSet, Input, SecretInput, useStyles2 } from '@grafana/ui';
import { testIds } from '../testIds';

export type AppPluginSettings = {
  grafanaUrl?: string;
  serviceAccountToken?: string;
  grafanaIsCloudStack?: boolean;
  smUrl?: string;
  smToken?: string;
  oncallUrl?: string;
  oncallToken?: string;
  cloudOrg?: string;
  cloudAccessPolicyToken?: string;
};

type State = {
  grafanaUrl: string;
  serviceAccountToken: string;
  grafanaIsCloudStack: boolean;
  smUrl: string;
  smToken: string;
  oncallUrl: string;
  oncallToken: string;
  cloudOrg: string;
  cloudAccessPolicyToken: string;

  isServiceAccountTokenSet: boolean;
  isSMTokenSet: boolean;
  isOnCallTokenSet: boolean;
  isCloudAccessPolicyTokenSet: boolean;
};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> { }

export const AppConfig = ({ plugin }: AppConfigProps) => {
  const s = useStyles2(getStyles);
  const { enabled, pinned, jsonData, secureJsonFields } = plugin.meta;
  const [state, setState] = useState<State>({
    grafanaUrl: jsonData?.grafanaUrl || '',
    serviceAccountToken: '',
    grafanaIsCloudStack: jsonData?.grafanaIsCloudStack || false,
    smUrl: jsonData?.smUrl || '',
    smToken: '',
    oncallUrl: jsonData?.oncallUrl || '',
    oncallToken: '',
    cloudOrg: jsonData?.cloudOrg || '',
    cloudAccessPolicyToken: '',
    isServiceAccountTokenSet: Boolean(secureJsonFields?.serviceAccountToken),
    isSMTokenSet: Boolean(secureJsonFields?.smToken),
    isOnCallTokenSet: Boolean(secureJsonFields?.oncallToken),
    isCloudAccessPolicyTokenSet: Boolean(secureJsonFields?.cloudAccessPolicyToken),
  });

  const onResetApiKey = () =>
    setState({
      ...state,
      serviceAccountToken: '',
      isServiceAccountTokenSet: false,
    });

  const onResetAccessPolicyToken = () =>
    setState({
      ...state,
      cloudAccessPolicyToken: '',
      isCloudAccessPolicyTokenSet: false,
    });

  const onResetSMToken = () =>
    setState({
      ...state,
      smToken: '',
      isSMTokenSet: false,
    });

  const onResetOncallToken = () =>
    setState({
      ...state,
      oncallToken: '',
      isOnCallTokenSet: false,
    });

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [event.target.name]: event.target.value.trim(),
    });
  };

  return (
    <div data-testid={testIds.appConfig.container}>
      <FieldSet label="API Settings">
        <Field label="Grafana Url" description="" className={s.marginTop}>
          <Input
            width={60}
            name="grafanaUrl"
            id="config-api-url"
            data-testid={testIds.appConfig.grafanaUrl}
            value={state.grafanaUrl}
            placeholder={`E.g.: https://my-grafana-instance.com`}
            onChange={onChange}
          />
        </Field>

        <Field label="Is Cloud Stack" description="Is this a cloud stack?">
          <Checkbox label="Is Cloud Stack"
            name="grafanaIsCloudStack"
            checked={state.grafanaIsCloudStack}
            onChange={(event) => {
              setState({
                ...state,
                grafanaIsCloudStack: event.currentTarget.checked,
              });
            }}
          />
        </Field>

        <Field label="Service Account Token" description="A service account token.">
          <SecretInput
            width={60}
            id="config-service-account-token"
            data-testid={testIds.appConfig.serviceAccountToken}
            name="serviceAccountToken"
            value={state.serviceAccountToken}
            isConfigured={state.isServiceAccountTokenSet}
            placeholder={'Your service account token'}
            onChange={onChange}
            onReset={onResetApiKey}
          />
        </Field>

        <Field label="SM Url" description="" className={s.marginTop}>
          <Input
            width={60}
            name="smUrl"
            id="config-sm-url"
            value={state.smUrl}
            placeholder={`E.g.: https://my-sm-instance.com`}
            onChange={onChange}
          />
        </Field>

        <Field label="SM Token" description="">
          <SecretInput
            width={60}
            id="config-sm-token"
            name="smToken"
            value={state.smToken}
            placeholder={'Your SM token'}
            onChange={onChange}
            isConfigured={state.isSMTokenSet}
            onReset={onResetSMToken}
          />
        </Field>

        <Field label="Oncall Url" description="" className={s.marginTop}>
          <Input
            width={60}
            name="oncallUrl"
            id="config-oncall-url"
            value={state.oncallUrl}
            placeholder={`E.g.: https://my-oncall-instance.com`}
            onChange={onChange}
          />
        </Field>

        <Field label="Oncall Token" description="">
          <SecretInput
            width={60}
            id="config-oncall-token"
            name="oncallToken"
            value={state.oncallToken}
            placeholder={'Your oncall token'}
            onChange={onChange}
            isConfigured={state.isOnCallTokenSet}
            onReset={onResetOncallToken}
          />
        </Field>

        <Field label="Cloud Org" description="" className={s.marginTop}>
          <Input
            width={60}
            name="cloudOrg"
            id="config-cloud-org"
            value={state.cloudOrg}
            placeholder={`E.g.: my-cloud-org`}
            onChange={onChange}
          />
        </Field>

        <Field label="Cloud Access Policy Token" description="">
          <SecretInput
            width={60}
            id="config-cloud-access-policy-token"
            name="cloudAccessPolicyToken"
            value={state.cloudAccessPolicyToken}
            isConfigured={state.isCloudAccessPolicyTokenSet}
            placeholder={'Access policy token'}
            onChange={onChange}
            onReset={onResetAccessPolicyToken}
          />
        </Field>

        <div className={s.marginTop}>
          <Button
            type="submit"
            data-testid={testIds.appConfig.submit}
            onClick={() => {
              const secureJsonData: KeyValue<any> = {};
              if (!state.isServiceAccountTokenSet) {
                secureJsonData.serviceAccountToken = state.serviceAccountToken;
              }
              if (!state.isCloudAccessPolicyTokenSet) {
                secureJsonData.cloudAccessPolicyToken = state.cloudAccessPolicyToken;
              }
              if (!state.isSMTokenSet) {
                secureJsonData.smToken = state.smToken;
              }
              if (!state.isOnCallTokenSet) {
                secureJsonData.oncallToken = state.oncallToken;
              }

              return updatePluginAndReload(plugin.meta.id, {
                enabled,
                pinned,
                jsonData: {
                  grafanaUrl: state.grafanaUrl,
                  cloudOrg: state.cloudOrg,
                  grafanaIsCloudStack: state.grafanaIsCloudStack,
                  smUrl: state.smUrl,
                  oncallUrl: state.oncallUrl,
                },
                // This cannot be queried later by the frontend.
                // We don't want to override it in case it was set previously and left untouched now.
                secureJsonData: secureJsonData,
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

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta<AppPluginSettings>>) => {
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
