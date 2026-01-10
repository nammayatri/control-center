
import { useState, useEffect } from 'react';
import { LogicEditor } from './LogicEditor';
import type { LogicNode } from '../types/JsonLogicTypes';
import type { LogicBuilderData } from '../hooks/useLogicBuilderData';

interface LogicBuilderProps {
    initialLogic: LogicNode[];
    onChange: (nodes: LogicNode[]) => void;
    data: LogicBuilderData;
}

export function LogicBuilder({ initialLogic, onChange, data }: LogicBuilderProps) {
    const [rootNodes, setRootNodes] = useState<LogicNode[]>(initialLogic);

    // Sync internal state if initialLogic changes (e.g. from "Clone")
    useEffect(() => {
        setRootNodes(initialLogic);
    }, [initialLogic]);

    const handleNodesChange = (newNodes: LogicNode[]) => {
        setRootNodes(newNodes);
        onChange(newNodes);
    };

    if (data.loading) {
        return <div className="p-4 text-sm text-muted-foreground">Loading configuration...</div>;
    }

    return (
        <div className="border rounded-md p-4 bg-background">
            <LogicEditor
                nodes={rootNodes}
                onChange={handleNodesChange}
                filterOptions={data.filterOptions}
                parameterOptions={data.parameterOptions}
            />

            {rootNodes.length === 0 && (
                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg mt-4">
                    <p>Start by adding a condition or parameter override.</p>
                </div>
            )}
        </div>
    );
}
