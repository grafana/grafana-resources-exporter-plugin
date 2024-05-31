import React, { useState } from 'react'
import { MultiSelect, Button } from '@grafana/ui'
import {SelectableValue} from '@grafana/data'

interface ResourceTypeSelectorProps {
    resourceTypes: string[]
    onChange: any
    className: any
}
export function ResourceTypeSelector(props: ResourceTypeSelectorProps) {

    const [resourceTypesSelectable, setResourceTypesSelectable] = useState<Array<SelectableValue<string>>>([])
    //const selectables: Array<SelectableValue<string>> = []
    const resourceTypeOptions: any[] = []
    
    console.log("SELECTOR", props.resourceTypes, typeof props.resourceTypes)
    props.resourceTypes.map((type)=>{
        resourceTypeOptions.push({
                label: type,
                value: type,
            })
    })

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
                label: type,
                value: type,
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
