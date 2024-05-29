import React from 'react';
import { useAsync } from "react-use";
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage, getBackendSrv } from '@grafana/runtime';
import { TextArea, useStyles2, ErrorWithStack, Spinner } from '@grafana/ui';
import { testIds } from '../components/testIds';
import pluginJson from '../plugin.json';

const FileViewer = (props: {filename: string, content: string}) => {
  const s = useStyles2(getStyles);
  return (
    <>
      <h2>{props.filename}</h2>
      <TextArea className={s.textArea}>{props.content}</TextArea>
    </>
  );
}

interface GeneratedFile {
  name: string;
  content: string
}

interface BackendResponse {
  files: GeneratedFile[];
}

const FileViewerList = () => {
  const state = useAsync(async () => {
    return await getBackendSrv().post<BackendResponse>(`api/plugins/${pluginJson.id}/resources/generate`, {
      outputFormat: "hcl",
    });
  });

  if (state.error) {
    return <ErrorWithStack error={state.error} title={'Unexpected error'} errorInfo={null} />;
  }
  if (state.loading) {
    return <Spinner />;
  }

  return (
    <>
      {state.value!.files.map((file, i) => (<FileViewer key={i} filename={file.name} content={file.content} />))}
    </>
  );
}

export function ExportPage() {
  const s = useStyles2(getStyles);
  return (
    <PluginPage>
      <div data-testid={testIds.exportPage.container}>
        WELCOME TO EXPORT PAGE.
        <div className={s.marginTop}>
          <FileViewerList/>
        </div>
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
  textArea: css`
    font-family: monospace, monospace;
    height: 200px;
  `
});
