import { Session } from 'https://esm.sh/neo4j-driver'
import { Neo4jRelationManagerCustom } from "./RelationManager.ts";
import {
  Relationship,
  Neo4jData,
  Neo4jSidData,
} from "../_neo4j.module.ts";

export class Neo4jBidirectionalRepositoryManager<
  T extends Neo4jData & Neo4jSidData,
  U extends Neo4jData & Neo4jSidData
  > {
  constructor(
    public relationshipManager1: Neo4jRelationManagerCustom<T>,
    public relationshipManager2: Neo4jRelationManagerCustom<U>
  ) { }

  async create(
    session: Session,
    startNodeId: string,
    endNodeId: string,
    relationshipProperties1: T,
    relationshipProperties2: U
  ): Promise<[Relationship<T>, Relationship<U>]> {
    const startToEnd = await this.relationshipManager1.create(
      session,
      startNodeId,
      endNodeId,
      relationshipProperties1
    );
    const endToStart = await this.relationshipManager2.create(
      session,
      endNodeId,
      startNodeId,
      relationshipProperties2
    );
    return [
      {
        type: startToEnd.type,
        properties: startToEnd.properties,
        startNodeId: startToEnd.startNodeId,
        endNodeId: startToEnd.endNodeId
      },
      {
        type: endToStart.type,
        properties: endToStart.properties,
        startNodeId: endToStart.startNodeId,
        endNodeId: endToStart.endNodeId
      }
    ];
  }

  async findById(
    session: Session,
    id1: string,
    id2: string
  ): Promise<[Relationship<T>, Relationship<U>]> {
    const relationship = await this.relationshipManager1.findById(session, id1);
    const reverseRelationship = await this.relationshipManager2.findById(
      session,
      id2
    );
    return [
      {
        type: relationship.type,
        properties: relationship.properties,
        startNodeId: relationship.startNodeId,
        endNodeId: relationship.endNodeId
      },
      {
        type: reverseRelationship.type,
        properties: reverseRelationship.properties,
        startNodeId: reverseRelationship.startNodeId,
        endNodeId: reverseRelationship.endNodeId
      }
    ];
  }

  async findBySid(
    session: Session,
    sid: string
  ): Promise<[Relationship<T>, Relationship<U>]> {
    const relationship = await this.relationshipManager1.findBySid(
      session,
      sid
    );
    const reverseRelationship = await this.relationshipManager2.findBySid(
      session,
      sid
    );
    return [
      {
        type: relationship.type,
        properties: relationship.properties,
        startNodeId: relationship.startNodeId,
        endNodeId: relationship.endNodeId
      },
      {
        type: reverseRelationship.type,
        properties: reverseRelationship.properties,
        startNodeId: reverseRelationship.startNodeId,
        endNodeId: reverseRelationship.endNodeId
      }
    ];
  }

  async findAll(
    session: Session
  ): Promise<{ 1: Relationship<T>[]; 2: Relationship<U>[] }> {
    const relationships = await this.relationshipManager1.findAll(session);
    const reverseRelationships = await this.relationshipManager2.findAll(
      session
    );
    return {
      1: relationships.map((relationship) => ({
        type: relationship.type,
        properties: relationship.properties,
        startNodeId: relationship.startNodeId,
        endNodeId: relationship.endNodeId
      })),
      2: reverseRelationships.map((reverseRelationship) => ({
        type: reverseRelationship.type,
        properties: reverseRelationship.properties,
        startNodeId: reverseRelationship.endNodeId,
        endNodeId: reverseRelationship.startNodeId
      }))
    };
  }

  async updateById(
    session: Session,
    id1: string,
    id2: string,
    relationshipProperties1: Partial<T>,
    relationshipProperties2: Partial<U>
  ): Promise<[Relationship<T>, Relationship<U>]> {
    const relationship = await this.relationshipManager1.updateById(
      session,
      id1,
      relationshipProperties1
    );
    const reverseRelationship = await this.relationshipManager2.updateById(
      session,
      id2,
      relationshipProperties2
    );
    return [
      {
        type: relationship.type,
        properties: relationship.properties,
        startNodeId: relationship.startNodeId,
        endNodeId: relationship.endNodeId
      },
      {
        type: reverseRelationship.type,
        properties: reverseRelationship.properties,
        startNodeId: reverseRelationship.startNodeId,
        endNodeId: reverseRelationship.endNodeId
      }
    ];
  }

  async updateBySid(
    session: Session,
    sid: string,
    relationshipProperties1: Partial<T>,
    relationshipProperties2: Partial<U>
  ): Promise<[Relationship<T>, Relationship<U>]> {
    const relationship = await this.relationshipManager1.updateBySid(
      session,
      sid,
      relationshipProperties1
    );
    const reverseRelationship = await this.relationshipManager2.updateBySid(
      session,
      sid,
      relationshipProperties2
    );
    return [
      {
        type: relationship.type,
        properties: relationship.properties,
        startNodeId: relationship.startNodeId,
        endNodeId: relationship.endNodeId
      },
      {
        type: reverseRelationship.type,
        properties: reverseRelationship.properties,
        startNodeId: reverseRelationship.startNodeId,
        endNodeId: reverseRelationship.endNodeId
      }
    ];
  }

  async deleteById(session: Session, id1: string, id2: string): Promise<void> {
    await this.relationshipManager1.deleteById(session, id1);
    await this.relationshipManager2.deleteById(session, id2);
  }

  async deleteBySid(session: Session, sid: string): Promise<void> {
    await this.relationshipManager1.deleteBySid(session, sid);
    await this.relationshipManager2.deleteBySid(session, sid);
  }
}
