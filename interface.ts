export type Neo4jData = {
    id: string,
}

export type Neo4jSidData = {
    sid: string,
}

export type Neo4jScdlevel2Data = {
    created: { at: string, by?: string },
    deleted?: { at: string, by: string }
}

export interface Relationship<T extends Neo4jData> {
    type: string;
    properties: T;
    startNodeId: string;
    endNodeId: string;
}

export interface RelationshipProperties {
    [key: string]: any;
}