import React, { useState, useMemo } from 'react'
import { MultiSelect, Button } from '@grafana/ui'
import { SelectableValue } from '@grafana/data'
import { ResourceType } from '../types/resourceTypes'

interface ResourceTypeSelectorProps {
    resourceTypes: ResourceType[]
    onChange: any
    className: any
}

export function ResourceTypeSelector(props: ResourceTypeSelectorProps) {

    const [resourceTypesSelectable, setResourceTypesSelectable] = useState<Array<SelectableValue<string>>>([])
    const resourceTypeOptions: Array<SelectableValue> = []
    
    console.log("SELECTOR", props.resourceTypes, typeof props.resourceTypes)
    useEffect(()=>{
        const selected: any[] = []
        props.resourceTypes.map((type: ResourceType)=>{
            resourceTypeOptions.push({
                    label: type,
                    value: type,
                })
            if (type.selected) {
                selected.push({
                    label: type.name,
                    value: type.name,
                })
            }
        })
        setResourceTypesSelectable(selected)
    }, [props.resourceTypes, resourceTypeOptions])

    const selectResourceType = (selections: Array<SelectableValue<string>>) => {
        setResourceTypesSelectable(selections)
        const types: string[] = []
        selections.forEach(selection=> selection.value && types.push(selection.value))
        props.onChange(types)
      }
    
    const selectAll = () => {
        const selectables: Array<SelectableValue<string>> = []
        props.resourceTypes.map((type)=>{
            selectables.push({
                label: type.name,
                value: type.name,
            })
        })
        setResourceTypesSelectable(selectables)
    }
    const selectNone = () => {
        setResourceTypesSelectable([])
    }
    return <>
            <MultiSelect className={props.className}
                        options={resourceTypeOptions}
                        value={resourceTypesSelectable}
                        onChange={selectResourceType}
            />
            <Button onClick={selectAll}>Select all</Button>
            <Button onClick={selectNone}>Select none</Button>
          </>
}
