import { Session } from 'https://esm.sh/neo4j-driver'
import { Neo4jQueryBuilder } from "./QueryBuilder.ts";

export class Neo4jRepository<T> {
  constructor(public label: string, public queryBuilder: Neo4jQueryBuilder) { }

  async create(session: Session, node: T): Promise<T> {
    const query = this.queryBuilder
      .match("n", `:${this.label}`)
      .set("n += $node", { node })
      .return("n");
    const records = await query.execute(session);
    const [record] = records;
    const { n } = record.toObject();
    return n;
  }

  async findBy<K extends keyof T>(session: Session, attribute: K, value: T[K]): Promise<T[]> {
    const query = this.queryBuilder
      .match("n", `:${this.label}`)
      .where(`n.${attribute as string} = $value`, { value })
      .return("n");
    const records = await query.execute(session);
    return records.map(item => item.toObject())
  }

  async findById(session: Session, id: string): Promise<T> {
    const query = this.queryBuilder
      .match("n", `:${this.label}`)
      .where("id(n) = $id", { id })
      .return("n");
    const records = await query.execute(session);
    const [record] = records;
    const { n } = record.toObject();
    return n;
  }

  async findAll(session: Session): Promise<T[]> {
    const query = this.queryBuilder
      .match("n", `:${this.label}`)
      .return("n");
    const records = await query.execute(session);
    return records.map((record) => {
      const { n } = record.toObject();
      return n;
    });
  }

  async updateById(
    session: Session,
    id: string,
    node: Partial<T>
  ): Promise<T> {
    const query = this.queryBuilder
      .match("n", `:${this.label}`)
      .where("id(n) = $id", { id })
      .set("n += $node", { node })
      .return("n");
    const records = await query.execute(session);
    const [record] = records;
    const { n } = record.toObject();
    return n;
  }

  async deleteById(session: Session, id: string): Promise<void> {
    const query = this.queryBuilder
      .match("n", `:${this.label}`)
      .where("id(n) = $id", { id })
      .delete("n");
    await query.execute(session);
  }
}
