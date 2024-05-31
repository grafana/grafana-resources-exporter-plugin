import React, { useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage, getBackendSrv } from '@grafana/runtime';
import {useStyles2, ErrorWithStack, Spinner, CodeEditor, RadioButtonGroup, Button, TabsBar, Tab, TabContent} from '@grafana/ui';
import { ResourceTypeSelector} from '../components/resourceTypeSelector'
import { testIds } from '../components/testIds';
import {GeneratedFile, GenerateResponse} from "../types/generator";
import { saveAs } from 'file-saver';
import JSZip from "jszip";
import pluginJson from '../plugin.json'
import { getResourceTypes } from '../hooks/resourceTypes'

const outputFormatOptions = [
  {label: 'HCL', value: 'hcl'},
  {label: 'JSON', value: 'json'},
  {label: 'Crossplane', value: 'crossplane'}
];
const disabledOutputFormats = ['crossplane']

export function ExportPage() {
  const s = useStyles2(getStyles);

  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [format, setFormat] = useState("hcl")
  const [error, setError] = useState<Error | undefined>(undefined)
  const [activeTab, setActiveTab] = useState(0)
  const [resourceTypes, setResourceTypes] = useState<string[]>([])
  let content: React.ReactNode;

  if (resourceTypes.length === 0) {
    getResourceTypes(setResourceTypes)
  }
  
  if (error) {
    content = <ErrorWithStack error={error} title={'Unexpected error'} errorInfo={null} />;
  } else if (loading) {
    content = <Spinner />;
  } else if (files?.length === 0) {
    content = <div className={s.marginTop}>
      <h1>Render your Grafana resources in Terraform</h1>
      <p>Resources within Grafana can be represented in other formats.</p>
      <p>Use the `Generate` button above to render all Grafana resources as Terraform files.
         You have a choice of HCL and JSON formats (with Crossplane and others coming).</p>
      <p>Once you have generated your resources, you can download them all as a zip file.</p>
    </div>
  } else {
    let fileContent = files[activeTab].content
    content = (
      <div className={s.marginTop}>
        <TabsBar>
        {files.map((file, i) => (<Tab key={i} active={i === activeTab} label={file.name} onChangeTab={_=>{setActiveTab(i)}}/>))}
        </TabsBar>
        <TabContent>
           <CodeEditor
            width="100%"
            height="500px"
            value={fileContent}
            language="hcl"
            showLineNumbers={true}
            showMiniMap={true}
            readOnly={true}
          />
        </TabContent>
      </div>
    );
  }
  const generate = async() => {
      setLoading(true)
      try {
        const types: string[] = []
        resourceTypes.map(t=>{
          types.push(`${t}.*`)
        })
        const exports = await getBackendSrv().post<GenerateResponse>(`api/plugins/${pluginJson.id}/resources/generate`, {
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

    archive.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "grafana-terraform-export.zip");
    });
  };

  return (
    <PluginPage>
      <div data-testid={testIds.exportPage.container}>
        <div>
          <RadioButtonGroup options={outputFormatOptions} disabledOptions={disabledOutputFormats} value={format} onChange={v => setFormat(v!)} size="md" />
          <ResourceTypeSelector className={s.marginLeft} resourceTypes={resourceTypes} onChange={setResourceTypes}/>
          <Button className={s.marginLeft} icon="arrow-to-right" onClick={_ => generate()}>Generate</Button>

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
});
