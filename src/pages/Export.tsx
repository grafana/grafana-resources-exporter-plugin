import React, { useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage, getBackendSrv } from '@grafana/runtime';
import { useStyles2, ErrorWithStack, Spinner, Button } from '@grafana/ui';
import { testIds } from '../components/testIds';
import { GeneratedFile, GenerateRequest, GenerateResponse } from "../types/generator";
import { saveAs } from 'file-saver';
import JSZip from "jszip";
import pluginJson from '../plugin.json'
import { ResultViewer } from '../components/ResultViewer'
import { OptionsSelector } from 'components/OptionsSelector';

export function ExportPage() {
  const s = useStyles2(getStyles);

  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [options, setOptions] = useState<GenerateRequest | undefined>(undefined)
  const [optionsCollapsed, setOptionsCollapsed] = useState(false)

  let content: React.ReactNode

  if (error) {
    content = <ErrorWithStack error={error} title={'Unexpected error'} errorInfo={null} />;
  } else if (loading) {
    content = <Spinner size={"xxl"} className={s.marginTop} />;
  } else if (files?.length === 0) {
    content = <div className={s.marginTop}>
      <p>Resources within Grafana can be represented in other formats.</p>
      <p>Use the `Generate` button above to render all Grafana resources as Terraform, Crossplane or Grizzly files.</p>
      <p>Once you have generated your resources, you can download them all as a zip file.</p>
    </div>
  } else {
    content = <ResultViewer files={files} />
  }
  const generate = async () => {
    setLoading(true)
    try {
      const exports = await getBackendSrv().post<GenerateResponse>(`api/plugins/${pluginJson.id}/resources/generate`, options);
      setFiles(exports.files)
    } catch (err) {
      if (err instanceof Error) {
        setError(err)
      } else {
        setError(new Error(`${err}`))
      }
    }
    setLoading(false)
  }

  const download = () => {
    if (!files || files.length === 0) {
      return;
    }

    const archive = new JSZip();

    files!.forEach(file => {
      archive.file(file.name, file.content);
    })

    archive.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, "grafana-terraform-export.zip");
    });
  };
  return (
    <PluginPage>
      <div data-testid={testIds.exportPage.container}>
        <OptionsSelector onChange={setOptions} className={optionsCollapsed ? s.displayNone : ""} />
        <div>
          <Button icon="arrow-to-right" data-testid='generate-button' onClick={_ => { setOptionsCollapsed(true); generate(); }} disabled={options === undefined}>Generate</Button>
          <Button className={s.marginLeft} icon="file-download" disabled={files.length === 0} onClick={_ => download()}>Download as zip</Button>
          <Button className={s.marginLeft} icon={optionsCollapsed ? "angle-double-down" : "angle-double-up"} onClick={_ => setOptionsCollapsed(!optionsCollapsed)}>{optionsCollapsed ? "Show options" : "Hide options"}</Button>
        </div>

        {content}
      </div>
    </PluginPage >
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  displayNone: css`
    display: none;
  `,
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
  marginLeft: css`
    margin-left: ${theme.spacing(2)};
  `,
  margin: css`
    margin-left: ${theme.spacing(2)};
    margin-right: ${theme.spacing(2)};
  `,
});
