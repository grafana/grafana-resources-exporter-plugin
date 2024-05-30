import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { LinkButton, useStyles2 } from '@grafana/ui';
import { prefixRoute } from '../utils/utils.routing';
import { ROUTES } from '../constants';
import { testIds } from '../components/testIds';
import { PluginPage } from '@grafana/runtime';


export function StartPage() {
  const s = useStyles2(getStyles);

  return (
    <PluginPage>
      <div data-testid={testIds.exportPage.container}>
        WELCOME TO EXPORTER START PAGE.
        <div className={s.marginTop}>
          <LinkButton data-testid={testIds.pageOne.navigateToFour} href={prefixRoute(ROUTES.Export)}>
            Generate HCL for this instance
          </LinkButton>
          <br />
          <LinkButton data-testid={testIds.pageOne.navigateToFour} href={prefixRoute(ROUTES.Export)}>
            Generate HCL for all stacks
          </LinkButton>
        </div>
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
});
