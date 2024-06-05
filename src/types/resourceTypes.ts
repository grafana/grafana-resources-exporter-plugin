export interface ResourceType {
    name: string
    selected: boolean
}

export interface ResourceTypeResponse {
    resources: ResourceType[];
}
