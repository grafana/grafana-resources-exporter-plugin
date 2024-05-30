import React from 'react';
import { useAsync } from "react-use";
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage, getBackendSrv } from '@grafana/runtime';
import { useStyles2, ErrorWithStack, Spinner, CodeEditor } from '@grafana/ui';
import { testIds } from '../components/testIds';
import pluginJson from '../plugin.json';

const FileViewer = (props: {filename: string, content: string, format: string}) => {
  return (
    <>
      <h2>{props.filename}</h2>
      <CodeEditor
        width="100%"
        height="200px"
        value={props.content}
        language={props.format}
        showLineNumbers={true}
        showMiniMap={true}
        readOnly={true}
      />
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
  const outputFormat = "hcl";
  const state = useAsync(async () => {
    return await getBackendSrv().post<BackendResponse>(`api/plugins/${pluginJson.id}/resources/generate`, {
      outputFormat: outputFormat,
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
      {state.value!.files.map((file, i) => (<FileViewer key={i} filename={file.name} content={file.content} format={outputFormat} />))}
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
});
