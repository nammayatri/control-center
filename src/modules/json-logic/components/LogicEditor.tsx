import type { LogicNode, LogicCondition, LogicParameter, SimpleComparison } from '../types/JsonLogicTypes';
import { Button } from '../../../components/ui/button';
import { Plus, Settings2, GitBranch } from 'lucide-react';
import { ParameterBlock } from './ParameterBlock';
import { ConditionBlock } from './ConditionBlock';
import type { FilterOptions } from './ConditionBlock';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

interface LogicEditorProps {
    nodes: LogicNode[];
    onChange: (nodes: LogicNode[]) => void;
    filterOptions: FilterOptions;
    parameterOptions?: string[];
    isNested?: boolean;
}

export function LogicEditor({ nodes, onChange, filterOptions, parameterOptions, isNested = false }: LogicEditorProps) {

    const handleAddParameter = () => {
        const newNode: LogicParameter = {
            id: crypto.randomUUID(),
            type: 'parameter',
            key: parameterOptions?.[0] || 'param',
            value: ''
        };
        onChange([...nodes, newNode]);
    };

    const handleAddCondition = () => {
        // Create a new condition with a simple default predicate
        const defaultPredicate: SimpleComparison = {
            variable: filterOptions.allObservedFilters?.[0] || 'extraDimensions.tripDistance',
            operator: '==',
            value: ''
        };

        const newNode: LogicCondition = {
            id: crypto.randomUUID(),
            type: 'condition',
            predicate: defaultPredicate,
            thenBlock: [],
            elseBlock: []
        };
        onChange([...nodes, newNode]);
    };

    const handleUpdateNode = (index: number, updatedNode: LogicNode) => {
        const newNodes = [...nodes];
        newNodes[index] = updatedNode;
        onChange(newNodes);
    };

    const handleRemoveNode = (index: number) => {
        const newNodes = nodes.filter((_, i) => i !== index);
        onChange(newNodes);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                {nodes.map((node, index) => {
                    if (node.type === 'parameter') {
                        return (
                            <ParameterBlock
                                key={node.id}
                                node={node as LogicParameter}
                                onChange={n => handleUpdateNode(index, n)}
                                onRemove={() => handleRemoveNode(index)}
                                parameterOptions={parameterOptions}
                            />
                        );
                    } else {
                        return (
                            <ConditionBlock
                                key={node.id}
                                node={node as LogicCondition}
                                onChange={n => handleUpdateNode(index, n)}
                                onRemove={() => handleRemoveNode(index)}
                                filterOptions={filterOptions}
                                parameterOptions={parameterOptions}
                            />
                        );
                    }
                })}
            </div>

            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="secondary" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Item
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleAddCondition}>
                            <GitBranch className="h-4 w-4 mr-2" />
                            Condition (If/Else)
                        </DropdownMenuItem>
                        {!isNested && (
                            <DropdownMenuItem onClick={handleAddParameter}>
                                <Settings2 className="h-4 w-4 mr-2" />
                                Parameter Setting
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
