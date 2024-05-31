export interface ResourceType {
    name: string
    hasLister: boolean
    selected: boolean
}

export interface ResourceTypeResponse {
    resources: ResourceType[];
}
