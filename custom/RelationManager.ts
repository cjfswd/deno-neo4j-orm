import { Session } from 'https://esm.sh/neo4j-driver'
import {
  Relationship,
  Neo4jRelationManager,
  Neo4jData,
  Neo4jSidData,
} from "../_neo4j.module.ts";

export class Neo4jRelationManagerCustom<
  T extends Neo4jData & Neo4jSidData
  > extends Neo4jRelationManager<T> {
  async findBySid(session: Session, sid: string): Promise<Relationship<T>> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .match("startNode", `-[r:${this.relationType}]->`, "endNode")
      .where("r.properties.sid = $sid", { sid })
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

  async updateBySid(
    session: Session,
    sid: string,
    relationProperties: Partial<T>
  ): Promise<Relationship<T>> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .match("startNode", `-[r:${this.relationType}]->`, "endNode")
      .where("r.properties.sid = $sid", { sid })
      .set("r += $relationProperties", { relationProperties })
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

  async deleteBySid(session: Session, sid: string): Promise<void> {
    const queryBuilder = this.neo4jQueryBuilder
      .match("startNode", `:${this.startNodeLabel}`)
      .match("startNode", `-[r:${this.relationType}]->`, "endNode")
      .where("r.properties.sid = $sid", { sid })
      .delete("r");
    await queryBuilder.execute(session);
  }
}
