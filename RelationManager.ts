import { Session } from 'https://esm.sh/neo4j-driver'
import { Relationship, Neo4jData } from './interface.ts'
import { Neo4jQueryBuilder } from "./QueryBuilder.ts";

export class Neo4jRelationManager<T extends Neo4jData> {
  constructor(
    public startNodeLabel: string,
    public endNodeLabel: string,
    public relationType: string,
    public neo4jQueryBuilder: Neo4jQueryBuilder
  ) { }

  async create(
    session: Session,
    startNodeId: string,
    endNodeId: string,
    relationProperties: T
  ): Promise<Relationship<T>> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .where("id(startNode) = $startNodeId", { startNodeId })
      .match("endNode", `:${this.endNodeLabel}`)
      .where("id(endNode) = $endNodeId", { endNodeId })
      .create(
        `(startNode)-[r:${this.relationType} :${{
          ...relationProperties,
        }}]->(endNode)`
      )
      .return("r.type as type", "r.properties as properties");
    const records = await queryBuilder.execute(session);
    const [record] = records;
    const { type, properties } = record.toObject();
    return {
      type,
      properties,
      startNodeId: startNodeId.toString(),
      endNodeId: endNodeId.toString()
    };
  }

  async findByAttribute<K extends keyof T>(
    session: Session,
    attribute: K,
    value: T[K]
  ): Promise<Relationship<T>> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .match("startNode", `-[r:${this.relationType}]->`, "endNode")
      .where(`r.${attribute as string} = $value`, { value })
      .return(
        "r.type as type",
        "r.properties as properties",
        "id(startNode) as startNodeId",
        "id(endNode) as endNodeId"
      );
    const records = await queryBuilder.execute(session);
    const [record] = records;
    if (!record) {
      throw new Error(`Relation with ${attribute as string} ${value} not found`);
    }
    const {
      type,
      properties,
      startNodeId,
      endNodeId
    } = record.toObject();
    return {
      type,
      properties,
      startNodeId: startNodeId.toString(),
      endNodeId: endNodeId.toString()
    };
  }

  async findById(session: Session, id: string): Promise<Relationship<T>> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .match("startNode", `-[r:${this.relationType}]->`, "endNode")
      .where("id(r) = $id", { id })
      .return(
        "r.type as type",
        "r.properties as properties",
        "id(startNode) as startNodeId",
        "id(endNode) as endNodeId"
      );
    const records = await queryBuilder.execute(session);
    const [record] = records;
    const {
      type,
      properties,
      startNodeId,
      endNodeId
    } = record.toObject();
    return {
      type,
      properties,
      startNodeId: startNodeId.toString(),
      endNodeId: endNodeId.toString()
    };
  }

  async findAll(session: Session): Promise<Relationship<T>[]> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .match("startNode", `-[r:${this.relationType}]->`, "endNode")
      .return(
        "r.type as type",
        "r.properties as properties",
        "id(startNode) as startNodeId",
        "id(endNode) as endNodeId"
      );
    const records = await queryBuilder.execute(session);
    return records.map((record) => {
      const {
        type,
        properties,
        startNodeId,
        endNodeId
      } = record.toObject();
      return {
        type,
        properties,
        startNodeId: startNodeId.toString(),
        endNodeId: endNodeId.toString()
      };
    });
  }

  async updateById(
    session: Session,
    id: string,
    relationshipProperties: Partial<T>
  ): Promise<Relationship<T>> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .match("endNode", `:${this.endNodeLabel}`)
      .match("startNode", `-[r:${this.relationType}]->`, "endNode")
      .where("id(r) = $id", { id })
      .set("r += $relationProperties", { relationshipProperties })
      .return(
        "r.type as type",
        "r.properties as properties",
        "id(startNode) as startNodeId",
        "id(endNode) as endNodeId"
      );
    const records = await queryBuilder.execute(session);
    const [record] = records;
    const {
      type,
      properties,
      startNodeId,
      endNodeId
    } = record.toObject();
    return {
      type,
      properties,
      startNodeId: startNodeId.toString(),
      endNodeId: endNodeId.toString()
    };
  }

  async deleteById(session: Session, id: string): Promise<void> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .match("endNode", `:${this.endNodeLabel}`)
      .match("startNode", `-[r:${this.relationType}]->`, "endNode")
      .where("id(r) = $id", { id })
      .delete("r");
    await queryBuilder.execute(session);
  }
}
