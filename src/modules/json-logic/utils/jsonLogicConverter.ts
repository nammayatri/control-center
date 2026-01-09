import type { LogicNode, LogicCondition, LogicParameter, Predicate, SimpleComparison, PredicateGroup } from '../types/JsonLogicTypes';

/**
 * Converts the UI Logic Tree into the specific JSON pattern required.
 * Pattern:
 * [
 *   { "config": { "cat": [ { "var": "config" }, ...overrides ] } }
 * ]
 */
export function exportToJson(nodes: LogicNode[]): any {
    // The root structure required by the system
    const root = [
        {
            config: {
                cat: [
                    { var: 'config' }, // Base config always comes first
                    ...convertNodesToCatItems(nodes),
                ],
            },
        },
    ];

    return root;
}

/**
 * Converts a list of LogicNodes into items suitable for a 'cat' array.
 */
function convertNodesToCatItems(nodes: LogicNode[]): any[] {
    const items: any[] = [];

    for (const node of nodes) {
        if (node.type === 'parameter') {
            const p = node as LogicParameter;
            // Parse number/boolean values
            let val = p.value;
            if (!isNaN(Number(p.value)) && p.value !== '') {
                val = Number(p.value);
            }
            if (p.value === 'true') val = true;
            if (p.value === 'false') val = false;

            // Handle JSON objects
            if (typeof p.value === 'string' && (p.value.startsWith('[') || p.value.startsWith('{'))) {
                try {
                    val = JSON.parse(p.value);
                } catch (e) {
                    // keep as string if not valid json
                }
            }

            items.push({ [p.key]: val });
        } else if (node.type === 'condition') {
            const c = node as LogicCondition;
            items.push(convertCondition(c));
        }
    }

    return items;
}

function convertCondition(condition: LogicCondition): any {
    // Construct the condition logic from the predicate
    const logic = convertPredicate(condition.predicate);

    // Then block
    const thenItems = convertNodesToCatItems(condition.thenBlock);
    const thenBlock = thenItems.length === 1 && !thenItems[0].if ? thenItems[0] : { cat: thenItems };

    // Else block
    let elseBlock: any = null;
    if (condition.elseBlock && condition.elseBlock.length > 0) {
        const elseItems = convertNodesToCatItems(condition.elseBlock);
        elseBlock = elseItems.length === 1 && !elseItems[0].if ? elseItems[0] : { cat: elseItems };
    }

    const ifArgs = [logic, thenBlock];
    if (elseBlock !== null) {
        ifArgs.push(elseBlock);
    }

    return { if: ifArgs };
}

function convertPredicate(predicate: Predicate): any {
    // Check if it's a group
    if ('groupOperator' in predicate) {
        const group = predicate as PredicateGroup;
        // Use && and || to match the existing JSON format
        const jsonOp = group.groupOperator === 'and' ? '&&' : '||';
        return {
            [jsonOp]: group.predicates.map(convertPredicate),
        };
    }

    // It's a simple comparison
    const simple = predicate as SimpleComparison;
    if (simple.operator === 'in') {
        const valArray = Array.isArray(simple.value) ? simple.value : [simple.value];
        return {
            in: [
                { var: simple.variable },
                valArray
            ]
        };
    } else if (simple.operator === '<=' || simple.operator === '>=') {
        return {
            [simple.operator]: [
                { var: simple.variable },
                Number(simple.value)
            ]
        };
    } else {
        return {
            [simple.operator]: [
                { var: simple.variable },
                simple.value
            ]
        };
    }
}
