import React, { ChangeEvent, useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { css } from '@emotion/css';
import { AppPluginMeta, GrafanaTheme2, PluginConfigPageProps, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Field, FieldSet, Input, SecretInput, useStyles2 } from '@grafana/ui';
import { testIds } from '../testIds';

export type AppPluginSettings = {
  grafanaUrl?: string;
  serviceAccountToken?: string;
};

type State = {
  grafanaUrl: string;
  serviceAccountToken: string;

  isServiceAccountTokenSet: boolean;
};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

export const AppConfig = ({ plugin }: AppConfigProps) => {
  const s = useStyles2(getStyles);
  const { enabled, pinned, jsonData, secureJsonFields } = plugin.meta;
  const [state, setState] = useState<State>({
    grafanaUrl: jsonData?.grafanaUrl || '',
    serviceAccountToken: '',
    isServiceAccountTokenSet: Boolean(secureJsonFields?.serviceAccountToken),
  });

  const onResetApiKey = () =>
    setState({
      ...state,
      serviceAccountToken: '',
      isServiceAccountTokenSet: false,
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

        <div className={s.marginTop}>
          <Button
            type="submit"
            data-testid={testIds.appConfig.submit}
            onClick={() =>
              updatePluginAndReload(plugin.meta.id, {
                enabled,
                pinned,
                jsonData: {
                  grafanaUrl: state.grafanaUrl,
                },
                // This cannot be queried later by the frontend.
                // We don't want to override it in case it was set previously and left untouched now.
                secureJsonData: state.isServiceAccountTokenSet
                  ? undefined
                  : {
                      serviceAccountToken: state.serviceAccountToken,
                    },
              })
            }
            disabled={Boolean(!state.grafanaUrl || (!state.isServiceAccountTokenSet && !state.serviceAccountToken))}
          >
            Save API settings
          </Button>
        </div>
      </FieldSet>
    </div>
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
