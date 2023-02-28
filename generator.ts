import { parse } from "https://deno.land/std@0.178.0/flags/mod.ts"
import { resolve, join } from "https://deno.land/std@0.178.0/path/mod.ts";

const version = 'v1.0.3'

export async function getModuleLatestVersion(moduleName: string) {
    return (await (await (fetch(`https://cdn.deno.land/neo4j_orm/meta/versions.json`))).json()).latest
}

export async function fileURLToPath(url: URL) {
    if (url.protocol !== 'file:') {
        throw new Error(`Expected file URL, got ${url}`);
    }
    return decodeURIComponent(url.pathname.replace(/^\/*([A-Za-z]:)(\/|$)/, '$1/').replace(/\//g, '\\'));
}

export async function getArchiveNamesInDirectory(dirPath: string): Promise<string[]> {
    const modelNames: string[] = [];

    for await (const dirEntry of Deno.readDir(dirPath)) {
        if (dirEntry.isFile && dirEntry.name.endsWith(".ts") && !dirEntry.name.startsWith('_')) {
            const modelName = dirEntry.name.slice(0, -3);
            modelNames.push(modelName);
        }
    }

    return modelNames;
}

export async function generateNodeInterfaceCode(modelNames: string[], sid: boolean, scd: boolean) {
    let code = '';

    for (let i = 0; i < modelNames.length; i++) {
        const modelName = modelNames[i];
        const nodeTypeName = `${modelName}Node`;
        const interfaceName = `${modelName}Model`;
        code += `export interface ${nodeTypeName} extends Neo4jData, ${sid ? 'Neo4jSidData, ' : ''}${scd ? 'Neo4jScdlevel2Data, ' : ''}IModel.${interfaceName} {}`;

        if (i !== modelNames.length - 1) {
            code += '\n';
        }
    }

    return code;
}

export async function generateInterfaceCode(modelNames: string[], relationNames: string[], sid: boolean, scd: boolean) {
    let code = '';

    for (let i = 0; i < modelNames.length + relationNames.length; i++) {
        const name = i < modelNames.length ? modelNames[i] : relationNames[i - modelNames.length];
        const isRelation = i >= modelNames.length;

        let typeName = '';
        let interfaceName = '';
        if (!isRelation) {
            typeName = `${name}Node`;
            interfaceName = `${name}Model`;
        } else {
            typeName = `${name}_Relation`;
            interfaceName = `${name}`;
        }

        code += `export interface ${typeName} extends Neo4jData${sid ? ', Neo4jSidData' : ''}${scd ? ', Neo4jScdlevel2Data' : ''}, ${isRelation ? 'IRelation' : 'IModel'}.${interfaceName} {}`;

        if (i !== modelNames.length + relationNames.length - 1) {
            code += '\n';
        }
    }

    return code;
}

export async function generateRepositoryCode(modelNames: string[], sid: boolean) {
    let code = '';

    for (let i = 0; i < modelNames.length; i++) {
        const modelName = modelNames[i];
        const nodeTypeName = `${modelName}Node`;
        const repositoryName = `${modelName}Repository`;

        code += `export const ${repositoryName} = new Neo4j.${sid ? 'Neo4jRepositoryCustom' : 'Neo4jRepository'}<${nodeTypeName}>('${modelName}', queryBuilder);`;

        if (i !== modelNames.length - 1) {
            code += '\n';
        }
    }

    return code;
}

export async function generateRelationInterfaceCode(relationNames: string[], sid: boolean, scd: boolean) {
    let code = '';

    for (let i = 0; i < relationNames.length; i++) {
        const relationName = relationNames[i];
        const interfaceRelationName = `${relationName}Relationship`;
        code += `export interface ${interfaceRelationName} extends Neo4jData, ${sid ? 'Neo4jSidData, ' : ''}${scd ? 'Neo4jScdlevel2Data, ' : ''}IRelationship.${relationName} {}`;

        if (i !== relationName.length - 1) {
            code += '\n';
        }
    }

    return code;
}

export async function generateRelationCode(modelNames: string[], relationNames: string[], sid: boolean) {
    let code = '';

    for (let i = 0; i < relationNames.length; i++) {
        const relationName = relationNames[i];
        const relationParts = relationName.split('_');
        let relationTypeName = `${relationName}_Relation`;
        let relationManagerTypeName = `${relationName}_Relation_Manager`;

        if (relationParts[0] === 'X') {
            for (let j = 0; j < modelNames.length; j++) {
                const model = modelNames[j];
                const replacedRelationName = `${model}_${relationParts[1]}_${relationParts[2]}`;
                relationManagerTypeName = `${replacedRelationName}_Relation_Manager`;

                code += `export const ${relationManagerTypeName} = new Neo4j.${sid ? 'Neo4jRelationManagerCustom' : 'Neo4jRelationManager'}<${relationTypeName}>('${model}', '${relationParts[2]}', '${replacedRelationName}', queryBuilder);`;
                if (j !== modelNames.length - 1) {
                    code += '\n';
                }
            }
        } else {
            code += `export const ${relationManagerTypeName} = new Neo4j.${sid ? 'Neo4jRelationManagerCustom' : 'Neo4jRelationManager'}<${relationTypeName}>('${relationParts[0]}', '${relationParts[2]}', '${relationName}', queryBuilder);`;
        }

        if (i !== relationNames.length - 1) {
            code += '\n';
        }
    }

    return code;
}

export async function generateRepositories(dirModelAbs: string, dirRelationAbs: string, modelModuleFile: string, relationModuleFile: string, sid: boolean, scd: boolean) {
    const dirModel = resolve(Deno.cwd(), dirModelAbs);
    const dirRelation = resolve(Deno.cwd(), dirRelationAbs);
    const modelNames = await getArchiveNamesInDirectory(dirModel);
    const relationNames = await getArchiveNamesInDirectory(dirRelationAbs);
    const interfaceCode = await generateInterfaceCode(modelNames, relationNames, sid, scd)
    // const nodeInterfaceCode = generateNodeInterfaceCode(modelNames, sid, scd);
    // const relationInterfaceCode = generateRelationInterfaceCode(modelNames, sid, scd)
    const repositoryCode = await generateRepositoryCode(modelNames, sid);
    const relationCode = await generateRelationCode(modelNames, relationNames, sid)

    return `
import { Neo4jData${sid ? `, Neo4jSidData` : ''}${scd ? `, Neo4jScdlevel2Data` : ''} } from 'https://deno.land/x/neo4j_orm@${version}/_neo4j.module.ts'
import * as Neo4j from 'https://deno.land/x/neo4j_orm@${version}/_neo4j.module.ts'
import * as IModel from 'file:///${join(dirModel, `${modelModuleFile}.ts`).replaceAll('\\', '/')}';
import * as IRelation from 'file:///${join(dirRelation, `${relationModuleFile}.ts`).replaceAll('\\', '/')}';

${interfaceCode}

export const queryBuilder = new Neo4j.Neo4jQueryBuilder();

${repositoryCode}
${relationCode}
`;
}

export async function generateLibraryByModels(
    dirModelAbs: string = join(Deno.cwd(), 'models'),
    dirRelationAbs: string = join(Deno.cwd(), 'relations'),
    modelModuleFile: string = '_models.module',
    relationModuleFile: string = '_relation.module',
    writeTo: string = Deno.cwd(),
    fileName: string = 'library',
    sid: boolean = false,
    scd: boolean = false,
) {
    const string = await generateRepositories(dirModelAbs, dirRelationAbs, modelModuleFile, relationModuleFile, sid, scd);
    // const dirName = join(fileURLToPath(new URL(writeTo, 'file:///')), '..');
    // const filePath = join(writeTo, `${fileName}.ts`);
    await Deno.writeTextFile(`${writeTo}\\${fileName}.ts`, string);
}

if (import.meta.main) {
    let { dirModel, dirRelation, modelModuleFile, relationModuleFile, writeTo, fileName, sid, scd } = parse(Deno.args, {
        boolean: ['sid', 'scd'],
        string: ['dirModel', 'dirRelation', 'modelModuleFile', 'relationModuleFile', 'writeTo', 'fileName'],
        default: {
            dirModel: join(Deno.cwd(), 'models'),
            dirRelation: join(Deno.cwd(), 'relations'),
            modelModuleFile: '_models.module',
            relationModuleFile: '_relations.module',
            writeTo: Deno.cwd(),
            fileName: 'library',
            sid: false,
            scd: false
        }
    });
    console.log({ dirModel, modelModuleFile, writeTo, fileName, sid, scd })
    await generateLibraryByModels(dirModel, dirRelation, modelModuleFile, relationModuleFile, writeTo, fileName, sid, scd)
}