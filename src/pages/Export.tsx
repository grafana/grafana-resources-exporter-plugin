import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { PluginPage, getBackendSrv } from '@grafana/runtime';
import { useStyles2, ErrorWithStack, Spinner, RadioButtonGroup, Button, Field } from '@grafana/ui';
import { ResourceTypeSelector } from '../components/resourceTypeSelector'
import { testIds } from '../components/testIds';
import { GeneratedFile, GenerateResponse } from "../types/generator";
import { saveAs } from 'file-saver';
import JSZip from "jszip";
import pluginJson from '../plugin.json'
import { getResourceTypes } from '../hooks/resourceTypes'
import { ResourceType } from '../types/resourceTypes'
import { ResultViewer } from '../components/ResultViewer'

const targetOptions = [
  { label: 'This Grafana instance', value: 'grafana' },
  { label: 'Grafana Cloud', value: 'cloud' },
];


export function ExportPage() {
  const s = useStyles2(getStyles);

  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [target, setTarget] = useState("grafana")
  const [format, setFormat] = useState("terraform-hcl")
  const [outputFormatOptions, setOutputFormatOptions] = useState<SelectableValue[]>([])
  const [error, setError] = useState<Error | undefined>(undefined)
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([])

  let content: React.ReactNode

  // Only terraform and crossplane formats are supported for Cloud
  useEffect(() => {
    if (target === "cloud" && format.startsWith("grizzly")) {
      setFormat("terraform-hcl")
    }

    const formatOptions = [
      { label: 'Terraform HCL', value: 'terraform-hcl' },
      { label: 'Terraform JSON', value: 'terraform-json' },
      { label: 'Crossplane', value: 'crossplane' },
    ];
    if (target !== "cloud") {
      formatOptions.push({ label: 'Grizzly JSON', value: 'grizzly-json' })
      formatOptions.push({ label: 'Grizzly YAML', value: 'grizzly-yaml' })
    }
    setOutputFormatOptions(formatOptions)
  }, [target, format])

  useEffect(() => {
    console.log("GETTING RESOURCE TYPES")
    getResourceTypes(target, format, setResourceTypes)
  }, [target, format]);

  if (error) {
    content = <ErrorWithStack error={error} title={'Unexpected error'} errorInfo={null} />;
  } else if (loading) {
    content = <Spinner />;
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
    let selected = 0
    resourceTypes.forEach(t => { if (t.selected) { selected++; } })
    if (selected === 0) {
      setError(new Error("No resource types selected"))
      return
    }
    setLoading(true)
    try {
      const types: string[] = []
      resourceTypes.map(t => {
        if (t.selected) {
          types.push(`${t.name}.*`)
        }
      })
      const exports = await getBackendSrv().post<GenerateResponse>(`api/plugins/${pluginJson.id}/resources/generate`, {
        target: target,
        outputFormat: format,
        onlyResources: types,
      });
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
        <div>
          <Field label="Target">
            <RadioButtonGroup options={targetOptions} value={target} onChange={v => setTarget(v!)} size="md" />
          </Field>
          <Field label="Output format">
            <RadioButtonGroup options={outputFormatOptions} value={format} onChange={v => setFormat(v!)} size="md" />
          </Field>
        </div>
        <div>
          <Field label="Included kinds">
            <ResourceTypeSelector resourceTypes={resourceTypes} onChange={setResourceTypes} />
          </Field>
        </div>
        <div>
          <Button icon="arrow-to-right" onClick={_ => generate()}>Generate</Button>
          <Button className={s.marginLeft} icon="file-download" disabled={files.length === 0} onClick={_ => download()}>Download as zip</Button>
        </div>

        {content}
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
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
