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

  return <div>
            <div className={s.selector}>
            <Button size="sm" fill="text" onClick={_=>setAllResourceTypes(false)}>select none</Button>
            <Button size="sm" fill="text" onClick={_=>setAllResourceTypes(true)}>select all</Button>
            </div>
            <div className={s.checkboxOuter}>
              {
                props.resourceTypes.map((type: ResourceType, i: number) => {return <div key={type.name} className={s.checkboxDiv}><Checkbox className={s.checkbox} checked={type.selected} label={type.name} onChange={(e)=>{updateResourceTypes(i)}}/></div>})
              }
            </div>
        </div>;
}
const getStyles = (theme: GrafanaTheme2) => ({
    selector: css`
      position: relative;
      top: -24px;
      left: 100px;
    `,
    checkboxOuter: css`
      position: relative;
      top: -20px;
    `,
    checkboxDiv: css`
      margin-left: ${theme.spacing(2)};
    `,
    checkbox: css`
      text-align: left;
      float: left;
      align-left: true;
      width: 250px;
    `,
  });
