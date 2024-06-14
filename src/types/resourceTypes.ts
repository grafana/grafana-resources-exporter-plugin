export interface ResourceType {
    name: string
    category: string
    selected: boolean
}

export interface ResourceTypeResponse {
    resources: ResourceType[];
}
