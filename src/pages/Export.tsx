import React, { useEffect, useRef, useState } from 'react';
import { PluginPage, getBackendSrv, isFetchError } from '@grafana/runtime';
import { Alert, ErrorWithStack, LoadingPlaceholder, ToolbarButton, ToolbarButtonRow } from '@grafana/ui';
import { GeneratedFile, GenerateRequest, GenerateResponse } from "../types/generator";
import { saveAs } from 'file-saver';
import JSZip from "jszip";
import pluginJson from '../plugin.json'
import { ResultViewer } from '../components/ResultViewer'
import { OptionsSelector } from 'components/OptionsSelector';
import { AppRootProps } from 'types/pluginData';

export function ExportPage(props: AppRootProps) {
  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ title: string, error: Error } | undefined>(undefined)
  const [warning, setWarning] = useState<{ title: string, error: Error } | undefined>(undefined)
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

  let content: React.ReactNode = <div>
    <p>Use the `Generate` button above to render all Grafana resources as Terraform, Crossplane or Grizzly files.</p>
  </div>

  if (error) {
    content = <ErrorWithStack title={error.title} error={error.error} errorInfo={null} />;
  } else if (files.length > 0) {
    content = <ResultViewer height={editorHeight + 'px'} files={files} />
  } else if (loading) {
    content = <LoadingPlaceholder text="Loading..." />
  }

  const generate = async () => {
    setLoading(true)
    try {
      const exports = await getBackendSrv().post<GenerateResponse>(`api/plugins/${pluginJson.id}/resources/generate`, options, { showErrorAlert: false });
      setFiles(exports.files || [{ name: "Result", content: "No resources were found" }])
      if (exports.warnings && exports.warnings.length > 0) {
        setWarning({ title: "Some resources could not be exported", error: new Error(exports.warnings.join('\n')) })
      }
      setError(undefined)
    } catch (err) {
      if (err instanceof Error) {
        setError({ title: err.message, error: err })
      } else if (isFetchError(err)) {
        setError({ title: err.statusText!, error: new Error(err.data?.message) })
      } else {
        setError({ title: "Unexpected Error", error: new Error(`${err}`) })
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

  const actions = <ToolbarButtonRow>
    <ToolbarButton icon="cog" tooltip={optionsCollapsed ? 'Show Options' : 'Hide Options'} variant="canvas" disabled={loading} onClick={_ => {
      setOptionsCollapsed(!optionsCollapsed);
      reloadEditorHeight();
    }}>{optionsCollapsed ? 'Show Options' : 'Hide Options'}</ToolbarButton>
    <ToolbarButton icon="file-download" tooltip='Download as zip' variant="canvas" disabled={files.length === 0 || error !== undefined || loading} onClick={_ => download()}>Download as zip</ToolbarButton>
    <ToolbarButton icon={loading ? 'spinner' : 'sync'} tooltip="Generate" variant='primary' disabled={loading} onClick={_ => { setOptionsCollapsed(true); generate(); reloadEditorHeight(); }}>Generate</ToolbarButton>
  </ToolbarButtonRow >

  return (
    <PluginPage actions={actions}>
      {warning &&
        <Alert title={warning.title} onRemove={() => setWarning(undefined)}>
          {warning.error.message}
        </Alert>
      }
      <div ref={topRef} style={optionsCollapsed ? { display: 'none' } : {}}>
        <OptionsSelector cloudEnabled={Boolean(props.meta.jsonData?.cloudOrg && props.meta.secureJsonFields?.cloudAccessPolicyToken)} onChange={setOptions} />
      </div>
      {content}
    </PluginPage >
  );
}
