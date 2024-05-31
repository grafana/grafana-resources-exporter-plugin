import React, { useState } from 'react'
import { MultiSelect, Button } from '@grafana/ui'
import { SelectableValue } from '@grafana/data'
import { ResourceType } from '../types/resourceTypes'

interface ResourceTypeSelectorProps {
    resourceTypes: ResourceType[]
    onChange: any
    className: any
}

export function ResourceTypeSelector(props: ResourceTypeSelectorProps) {
    const [selectedResourceTypes, setSelectedResourceTypes] = useState<SelectableValue[]>([])

    const selectResourceType = (selections: Array<SelectableValue<string>>) => {
        setSelectedResourceTypes(props.resourceTypes.filter((type) => selections.filter(s => s.value === type.name).length > 0).map((type) => { return { label: type.name, value: type.name } }))
        props.onChange(props.resourceTypes.map((type) => { type.selected = selections.filter(s => s.value === type.name).length > 0; return type }))
    }

    const selectAll = () => {
        selectResourceType(props.resourceTypes.map((type) => { return { label: type.name, value: type.name } }))
    }

    const selectNone = () => {
        selectResourceType([])
    }

    return <>
        <MultiSelect className={props.className}
            options={props.resourceTypes.map((type) => { return { label: type.name, value: type.name } })}
            value={selectedResourceTypes}
            onChange={selectResourceType}
        />
        <Button onClick={selectAll}>Select all</Button>
        <Button onClick={selectNone}>Select none</Button>
    </>
}
