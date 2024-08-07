import React from 'react'
import { Button, Checkbox, useStyles2 } from '@grafana/ui'
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { ResourceType } from '../types/resourceTypes'

interface ResourceTypeSelectorProps {
  resourceTypes: ResourceType[]
  onChange: (resourceTypes: ResourceType[]) => void
}

export function ResourceTypeSelector(props: ResourceTypeSelectorProps) {
  const s = useStyles2(getStyles);
  const updateResourceTypes = (name: string) => {
    const updatedResourceTypes: ResourceType[] = props.resourceTypes.map((item, index) => {
      if (item.name === name) {
        item.selected = !item.selected
      }
      return item
    })
    props.onChange(updatedResourceTypes)
  }
  const setAllResourceTypes = (state: boolean, category?: string) => {
    const updatedResourceTypes: ResourceType[] = props.resourceTypes.map((item, index) => {
      if (category && item.category !== category) {
        return item
      }
      item.selected = state
      return item
    })
    props.onChange(updatedResourceTypes)
  }

  const grouped = props.resourceTypes.reduce(
    (result: Record<string, ResourceType[]>, currentValue: ResourceType) => {
      const categoryResult = result[currentValue.category] || [];
      categoryResult.push(currentValue);
      result[currentValue.category] = categoryResult.sort((a: ResourceType, b: ResourceType) => (a.name.localeCompare(b.name)));
      return result;
    }, {});
  return <div>
    <div className={s.resourceTypeSelector}>
      <Button size="sm" fill="text" onClick={_ => setAllResourceTypes(false)}>select none</Button>
      <Button size="sm" fill="text" onClick={_ => setAllResourceTypes(true)}>select all</Button>
    </div>
    <div className={s.resourceTypeCheckbox}>
      {
        Object.keys(grouped).sort().map((category: string) => {
          const totalCount = grouped[category].length;
          const selectedCount = grouped[category].filter((type: ResourceType) => type.selected).length;

          return <div key={category} className={s.row}>
            {/* Category name (only shown if there are multiple categories) */}
            {
              Object.keys(grouped).length > 1 && <div className={s.category}>
                {category}
                <br />

                <Button size="sm" className={s.categoryButton} fill="text" onClick={_ => setAllResourceTypes(true, category)}>Select all</Button>
                <Button size="sm" className={s.categoryButton} fill="text" onClick={_ => setAllResourceTypes(false, category)}>none</Button>
              </div>
            }

            {/* Resource types */}
            <div className={s.resourceTypes}>
              {grouped[category].map((type: ResourceType, i: number) => {
                return <Checkbox className={s.checkbox} key={type.name} checked={type.selected} label={type.name} onChange={(e) => { updateResourceTypes(type.name) }} />
              })}
            </div>
            <br />
          </div>;
        }
        )
      }
    </div>
  </div >;
}

const getStyles = (theme: GrafanaTheme2) => ({
  checkbox: css`
    margin-right: ${theme.spacing(2)};
`,
  row: css`
    display: table-row;
`,
  category: css`
    display: table-cell;
    width: 150px;
    padding-bottom: ${theme.spacing(1)};
`,
  categoryButton: css`
    padding: 0;
    margin-right: ${theme.spacing(1)};
`,
  resourceTypes: css`
    display: table - cell;
`,
  resourceTypeSelector: css`
    position: relative;
    top: -24px;
    left: 100px;
`,
  resourceTypeCheckbox: css`
    position: relative;
    top: -20px;
    display: table;
`,
});
