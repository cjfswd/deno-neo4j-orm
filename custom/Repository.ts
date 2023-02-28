import { Session } from "https://esm.sh/neo4j-driver";
import { Neo4jSidData } from '../interface.ts';
import { Neo4jRepository } from '../Repository.ts'

export class Neo4jRepositoryCustom<T extends Neo4jSidData> extends Neo4jRepository<T> {
    async findBySid(session: Session, sid: string): Promise<T> {
        return (await this.findBy(session, 'sid', sid))[0];
    }

    async updateBySid(
        session: Session,
        sid: string,
        node: Partial<T>
    ): Promise<T> {
        const query = this.queryBuilder
            .match("n", `:${this.label}`)
            .where("sid(n) = $sid", { sid })
            .set("n += $node", { node })
            .return("n");
        const records = await query.execute(session);
        const [record] = records;
        const { n } = record.toObject();
        return n;
    }

    async deleteBySid(session: Session, sid: string): Promise<void> {
        const query = this.queryBuilder
            .match("n", `:${this.label}`)
            .where("sid(n) = $sid", { sid })
            .delete("n");
        await query.execute(session);
    }
}