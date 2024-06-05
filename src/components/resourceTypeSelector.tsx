import React from 'react'
import { Button, Checkbox, useStyles2 } from '@grafana/ui'
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { ResourceType } from '../types/resourceTypes'

interface ResourceTypeSelectorProps {
    resourceTypes: ResourceType[]
    onChange: any
}

export function ResourceTypeSelector(props: ResourceTypeSelectorProps) {
  const s = useStyles2(getStyles);
  const updateResourceTypes = (i: number) => {
    const updatedResourceTypes: ResourceType[] = props.resourceTypes.map((item, index)=> {
      if (index === i) {
        item.selected = !item.selected
      }
      return item
    })
    props.onChange(updatedResourceTypes)
  }
  const setAllResourceTypes = (state: boolean) => {
    const updatedResourceTypes: ResourceType[] = props.resourceTypes.map((item, index)=> {
      item.selected = state
      return item
    })
    props.onChange(updatedResourceTypes)
  }

  const sorted = props.resourceTypes.sort((a: ResourceType, b: ResourceType)=> (a.name.localeCompare(b.name)))
  return <div>
            <div className={s.resourceTypeSelector}>
            <Button size="sm" fill="text" onClick={_=>setAllResourceTypes(false)}>select none</Button>
            <Button size="sm" fill="text" onClick={_=>setAllResourceTypes(true)}>select all</Button>
            </div>
            <div className={s.resourceTypeCheckbox}>
              {
                sorted.map((type: ResourceType, i: number) => {return <Checkbox className={s.checkbox} key={type.name} checked={type.selected} label={type.name} onChange={(e)=>{updateResourceTypes(i)}}/>})
              }
            </div>
        </div>;
}
const getStyles = (theme: GrafanaTheme2) => ({
    checkbox: css`
      margin-left: ${theme.spacing(2)};
    `,
    resourceTypeSelector: css`
      position: relative;
      top: -24px;
      left: 100px;
    `,
    resourceTypeCheckbox: css`
      position: relative;
      top: -20px;
    `,
  });
