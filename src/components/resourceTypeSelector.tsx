import React, { useState } from 'react'
import { MultiSelect, Button } from '@grafana/ui'
import { SelectableValue } from '@grafana/data'
import { ResourceType } from '../types/resourceTypes'

interface ResourceTypeSelectorProps {
    resourceTypes: ResourceType[]
    onChange: any
}

export function ResourceTypeSelector(props: ResourceTypeSelectorProps) {
    const [selectedResourceTypes, setSelectedResourceTypes] = useState<SelectableValue[]>([])


    const selectResourceType = (selections: Array<SelectableValue<string>>) => {
        setSelectedResourceTypes(props.resourceTypes.filter((type) => selections.filter(s => s.value === type.name).length > 0).map((type) => { return { label: type.name, value: type.name } }))
        props.onChange(props.resourceTypes.map((type) => { type.selected = selections.filter(s => s.value === type.name).length > 0; return type }))
    }

    const selectNone = () => {
        selectResourceType([])
    }


    return <>
        <MultiSelect
            maxVisibleValues={3}
            noMultiValueWrap={true}
            closeMenuOnSelect={false}
            placeholder='All resource types'
            width={50}
            options={props.resourceTypes.map((type) => { return { label: type.name, value: type.name } })}
            value={selectedResourceTypes}
            onChange={selectResourceType}
        />
        <Button onClick={selectNone}>X</Button>
    </>
}
