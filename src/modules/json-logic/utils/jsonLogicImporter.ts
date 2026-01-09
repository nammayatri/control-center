import type { LogicNode, Predicate, SimpleComparison, PredicateGroup } from '../types/JsonLogicTypes';

/**
 * Parses existing JSON Logic into the UI's LogicNode structure.
 * This is the reverse operation of exportToJson.
 *
 * Expected Structure:
 * Root: [ { config: { cat: [ {var:'config'}, ...blocks ] } } ]
 */
export function importFromJson(json: any): LogicNode[] {
    console.log('importFromJson received:', json);

    if (!json) {
        console.warn('importFromJson: json is null or undefined');
        return [];
    }

    // Handle different input structures
    let catArray: any[] = [];

    // Case 1: Standard structure [{ config: { cat: [...] }}]
    if (Array.isArray(json) && json.length > 0 && json[0]?.config?.cat) {
        catArray = json[0].config.cat;
        console.log('importFromJson: Using standard structure, catArray:', catArray);
    }
    // Case 2: Direct array of rules [{ if: [...] }, { param: value }]
    else if (Array.isArray(json) && json.length > 0) {
        // Check if first element looks like a rule (has 'if' or is a parameter object)
        const firstItem = json[0];
        if (firstItem && (firstItem.if || (!firstItem.config && typeof firstItem === 'object'))) {
            catArray = json;
            console.log('importFromJson: Using direct rules array, catArray:', catArray);
        } else {
            console.warn('importFromJson: Array structure not recognized:', json);
            return [];
        }
    }
    // Case 3: Single rule object { if: [...] }
    else if (json.if) {
        catArray = [json];
        console.log('importFromJson: Using single rule object, catArray:', catArray);
    }
    else {
        console.warn('importFromJson: Unrecognized structure:', json);
        return [];
    }

    const nodes: LogicNode[] = [];

    // Skip the first item if it is simply {"var": "config"} (Base Config)
    const startIndex = (catArray.length > 0 && catArray[0]?.var === 'config') ? 1 : 0;

    for (let i = startIndex; i < catArray.length; i++) {
        const item = catArray[i];
        const parsedNode = parseItem(item);
        if (parsedNode) {
            nodes.push(parsedNode);
        }
    }

    console.log('importFromJson: Parsed nodes:', nodes);
    return nodes;
}

function parseItem(item: any): LogicNode | null {
    if (!item) return null;

    // Skip {var: "config"} which is just a pass-through
    if (item.var === 'config') return null;

    // 1. Check if it's a Condition Block (If)
    // Structure: {"if": [condition, then, else?]}
    if (Object.prototype.hasOwnProperty.call(item, 'if')) {
        const ifArray = item['if'];
        if (!Array.isArray(ifArray) || ifArray.length < 2) return null;

        const [conditionLogic, thenLogic, elseLogic] = ifArray;

        // Recursively parse the condition logic into a Predicate
        const predicate = parsePredicate(conditionLogic);
        if (!predicate) {
            console.warn('Failed to parse predicate:', conditionLogic);
            return null;
        }

        const thenNodes = parseBlock(thenLogic);
        const elseNodes = elseLogic ? parseBlock(elseLogic) : [];

        return {
            id: crypto.randomUUID(),
            type: 'condition',
            predicate: predicate,
            thenBlock: thenNodes,
            elseBlock: elseNodes,
        };
    }

    // 2. Parameter (Result Object)
    if (typeof item === 'object') {
        const keys = Object.keys(item).filter(k =>
            k !== 'if' && k !== 'cat' && k !== 'var' &&
            k !== 'and' && k !== 'or' && k !== '&&' && k !== '||'
        );
        if (keys.length > 0) {
            const firstKey = keys[0];
            return {
                id: crypto.randomUUID(),
                type: 'parameter',
                key: firstKey,
                value: item[firstKey],
            };
        }
    }

    return null;
}

// Parses the predicate part of an "if" into our new Predicate type
function parsePredicate(logic: any): Predicate | null {
    if (!logic || typeof logic !== 'object') return null;

    const keys = Object.keys(logic);
    if (keys.length !== 1) return null;
    const op = keys[0];
    const args = logic[op];

    // Handle Groups (AND/OR) - support both notations
    if (op === 'and' || op === 'or' || op === '&&' || op === '||') {
        if (!Array.isArray(args)) return null;
        const children = args.map(parsePredicate).filter((n): n is Predicate => n !== null);

        // Normalize operator to 'and' or 'or'
        const normalizedOp = (op === '&&' || op === 'and') ? 'and' : 'or';

        const group: PredicateGroup = {
            groupOperator: normalizedOp,
            predicates: children,
        };
        return group;
    }

    // Handle Range Comparison (3 arguments): { "<=": [0, {"var": "x"}, 4000] }
    if (Array.isArray(args) && args.length === 3) {
        const [left, mid, right] = args;
        // Check if middle is a var reference
        if (mid && mid.var) {
            // This is a range check: left <= var <= right (or similar)
            // We'll convert it to TWO simple comparisons joined by AND
            // For example: { "<=": [0, {"var": "x"}, 4000] } becomes:
            // (0 <= x) AND (x <= 4000)
            // But our SimpleComparison format is: { variable, operator, value }
            // So we create: (x >= 0) AND (x <= 4000)

            const leftComparison: SimpleComparison = {
                variable: mid.var,
                operator: '>=',
                value: left
            };
            const rightComparison: SimpleComparison = {
                variable: mid.var,
                operator: op as any, // <= or >=
                value: right
            };

            // Create an AND group with both comparisons
            const group: PredicateGroup = {
                groupOperator: 'and',
                predicates: [leftComparison, rightComparison]
            };
            return group;
        }
    }

    // Handle Simple Comparison (2 arguments)
    // { "==": [ { "var": "field" }, "value" ] }
    if (Array.isArray(args) && args.length === 2) {
        const [left, right] = args;

        // Check if left is a var reference
        if (left && left.var) {
            const simple: SimpleComparison = {
                variable: left.var,
                operator: op as any,
                value: right,
            };
            return simple;
        }

        // Check if right is a var reference (reversed order)
        if (right && right.var) {
            // Flip the operator if needed
            let flippedOp = op;
            if (op === '<=') flippedOp = '>=';
            else if (op === '>=') flippedOp = '<=';

            const simple: SimpleComparison = {
                variable: right.var,
                operator: flippedOp as any,
                value: left,
            };
            return simple;
        }
    }

    console.warn('Unrecognized predicate format:', logic);
    return null;
}

function parseBlock(blockLogic: any): LogicNode[] {
    if (!blockLogic) return [];

    // Skip {var: "config"} pass-through
    if (blockLogic.var === 'config') return [];

    if (blockLogic.cat && Array.isArray(blockLogic.cat)) {
        return blockLogic.cat.map((item: any) => parseItem(item)).filter((n: any) => n !== null);
    }
    const single = parseItem(blockLogic);
    return single ? [single] : [];
}
