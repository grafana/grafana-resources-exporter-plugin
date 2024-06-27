import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage, getBackendSrv, isFetchError } from '@grafana/runtime';
import { useStyles2, ErrorWithStack, Spinner, Button } from '@grafana/ui';
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
  const [error, setError] = useState<{ title: string, error: Error, info: React.ErrorInfo | null } | undefined>(undefined)
  const [options, setOptions] = useState<GenerateRequest | undefined>(undefined)
  const [optionsCollapsed, setOptionsCollapsed] = useState(false)

  // Set the height of the editor to fill the remaining space
  const topRef = useRef(null)
  const [editorHeight, setEditorHeight] = useState(0)
  const reloadEditorHeight = () => {
    const currentTopRef = topRef.current as unknown as HTMLElement;
    const topHeight = currentTopRef.clientHeight;

    // 215 is an estimate of the height of Grafana's header
    setEditorHeight(Math.max(window.innerHeight - 220 - topHeight, 300))
  }
  useEffect(reloadEditorHeight, [topRef, optionsCollapsed, loading, options]);

  // Register the resize event listener only once
  const [resizeRegistered, setResizeRegistered] = useState(false)
  useEffect(() => {
    if (resizeRegistered) {
      return;
    }
    setResizeRegistered(true);
    console.log('registering resize event listener')
    window.addEventListener('resize', reloadEditorHeight);
  }, [resizeRegistered])

  let content: React.ReactNode

  if (error) {
    content = <ErrorWithStack title={error.title} error={error.error} errorInfo={error.info} />;
  } else if (loading) {
    content = <Spinner size={"xxl"} className={s.marginTop} />;
  } else if (files?.length === 0) {
    content = <div className={s.marginTop}>
      <p>Resources within Grafana can be represented in other formats.</p>
      <p>Use the `Generate` button above to render all Grafana resources as Terraform, Crossplane or Grizzly files.</p>
      <p>Once you have generated your resources, you can download them all as a zip file.</p>
    </div>
  } else {
    content = <ResultViewer height={editorHeight + 'px'} files={files} />
  }
  const generate = async () => {
    setLoading(true)
    try {
      const exports = await getBackendSrv().post<GenerateResponse>(`api/plugins/${pluginJson.id}/resources/generate`, options, { showErrorAlert: false });
      setFiles(exports.files || [{ name: "Result", content: "No resources were found" }])
    } catch (err) {
      if (err instanceof Error) {
        setError({ title: err.message, error: err, info: null })
      } else if (isFetchError(err)) {
        setError({ title: err.statusText!, error: new Error(err.data?.message), info: null })
      } else {
        setError({ title: "Unexpected Error", error: new Error(`${err}`), info: null })
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
      <div ref={topRef}>
        <OptionsSelector onChange={setOptions} className={optionsCollapsed ? s.displayNone : ""} />
        <Button icon="arrow-to-right" onClick={_ => { setOptionsCollapsed(true); generate(); reloadEditorHeight(); }} disabled={options === undefined}>Generate</Button>
        <Button className={s.marginLeft} icon="file-download" disabled={files.length === 0} onClick={_ => download()}>Download as zip</Button>
        <Button className={s.marginLeft} icon={optionsCollapsed ? "angle-double-down" : "angle-double-up"} onClick={_ => { setOptionsCollapsed(!optionsCollapsed); }}>{optionsCollapsed ? "Show options" : "Hide options"}</Button>
      </div>
      {content}
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
