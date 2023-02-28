import { Session, Transaction } from 'https://esm.sh/neo4j-driver'

type Params = { [key: string]: unknown };
type QueryPart = [string, Params];
type QueryParts = QueryPart[];

export class Neo4jQueryBuilder<T extends QueryParts = []> {
  private queryParts: T;

  constructor(queryParts: T = [] as unknown as T) {
    this.queryParts = queryParts;
  }

  select<K extends string>(
    ...columns: K[]
  ): Neo4jQueryBuilder<[...T, ["SELECT", { columns: K[] }]]> {
    return new Neo4jQueryBuilder([...this.queryParts, ["SELECT", { columns }]]);
  }

  match<K extends string>(
    node: K,
    ...rest: K[]
  ): Neo4jQueryBuilder<[...T, ["MATCH", { nodes: K[] }]]> {
    return new Neo4jQueryBuilder([
      ...this.queryParts,
      ["MATCH", { nodes: [node, ...rest] }]
    ]);
  }

  where(
    condition: string,
    params: Params = {}
  ): Neo4jQueryBuilder<
    [...T, ["WHERE", { condition: string; params: Params }]]
  > {
    return new Neo4jQueryBuilder([
      ...this.queryParts,
      ["WHERE", { condition, params }]
    ]);
  }

  set(
    properties: string,
    params: Params = {}
  ): Neo4jQueryBuilder<
    [...T, ["SET", { properties: string; params: Params }]]
  > {
    return new Neo4jQueryBuilder([
      ...this.queryParts,
      ["SET", { properties, params }]
    ]);
  }

  create(
    node: string,
    properties: Params = {}
  ): Neo4jQueryBuilder<[...T, ["CREATE", { node: string; params: Params }]]> {
    return new Neo4jQueryBuilder([
      ...this.queryParts,
      ["CREATE", { node, params: properties }]
    ]);
  }

  delete(
    node: string
  ): Neo4jQueryBuilder<[...T, ["DELETE", { node: string }]]> {
    return new Neo4jQueryBuilder([...this.queryParts, ["DELETE", { node }]]);
  }

  build(): { query: string; params: Params } {
    const { query, params } = this.queryParts.reduce(
      (acc, [part, partParams]) => {
        acc.query += part + " ";
        if (partParams) {
          acc.params = { ...acc.params, ...partParams };
        }
        return acc;
      },
      { query: "", params: {} }
    );
    return { query, params };
  }

  return<Keys extends string>(
    ...keys: Keys[]
  ): Neo4jQueryBuilder<[...T, ["RETURN", { keys: Keys[] }]]> {
    return new Neo4jQueryBuilder([...this.queryParts, ["RETURN", { keys }]]);
  }

  async execute(
    session: Session,
    useTransaction: boolean = false
  ) {
    const { query, params } = this.build();

    if (!useTransaction) {
      const result = await session.run(query, params);
      return result.records;
    } else {
      const transaction: Transaction = session.beginTransaction();
      try {
        const result = await transaction.run(query, params);
        await transaction.commit();
        return result.records;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
  }
}
