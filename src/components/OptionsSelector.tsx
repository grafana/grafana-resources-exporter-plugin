import React, { useState, useEffect } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { RadioButtonGroup, Field, Alert, useStyles2 } from '@grafana/ui';
import { ResourceTypeSelector } from './ResourceTypeSelector'
import { getResourceTypes } from '../hooks/resourceTypes'
import { ResourceType } from '../types/resourceTypes'
import { GenerateRequest } from 'types/generator';
import { css } from '@emotion/css';

const targetOptions = [
  { label: 'This Grafana instance', value: 'grafana' },
  { label: 'Grafana Cloud', value: 'cloud' },
];

interface OptionsSelectorProps {
  onChange: React.Dispatch<React.SetStateAction<GenerateRequest | undefined>>
  className?: string
}

export function OptionsSelector(props: OptionsSelectorProps) {
  const s = useStyles2(getStyles);
  const [target, setTarget] = useState("grafana")
  const [format, setFormat] = useState("terraform-hcl")
  const [outputFormatOptions, setOutputFormatOptions] = useState<SelectableValue[]>([])
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([])
  const [error, setError] = useState<string>("")

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
    getResourceTypes(target, format, resourceTypes, setResourceTypes)
  }, [target, format, resourceTypes]);

  useEffect(() => {
    if (resourceTypes.filter(r => r.selected).length === 0) {
      setError("At least one resource type must be selected")
      props.onChange(undefined);
      return
    }
    setError("")
    props.onChange({ target, outputFormat: format, onlyResources: resourceTypes.filter(r => r.selected).map(r => r.name + ".*") })
  }, [props, target, format, resourceTypes]);

  return (
    <div className={props.className}>
      <Field label="Target">
        <RadioButtonGroup options={targetOptions} value={target} onChange={v => setTarget(v!)} size="md" />
      </Field>
      <Field label="Output format">
        <RadioButtonGroup options={outputFormatOptions} value={format} onChange={v => setFormat(v!)} size="md" />
      </Field>
      <Field label="Included kinds" className={s.noBottomMargin}>
        <ResourceTypeSelector resourceTypes={resourceTypes} onChange={setResourceTypes} />
      </Field>
      {error === "" ? <></> : <Alert title={error} />}
    </div >
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  noBottomMargin: css`
      margin-bottom: 0;
    `,
});
