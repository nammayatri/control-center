
import type { LogicParameter } from '../types/JsonLogicTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Trash2 } from 'lucide-react';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';

interface ParameterBlockProps {
    node: LogicParameter;
    onChange: (newNode: LogicParameter) => void;
    onRemove: () => void;
    parameterOptions?: string[];
}

export function ParameterBlock({ node, onChange, onRemove, parameterOptions = [] }: ParameterBlockProps) {

    // If no options (or very few), allow free text input for key?
    // Using a Combobox would be best, but for now, let's just use Input if options are empty.
    const hasOptions = parameterOptions && parameterOptions.length > 0;

    const handleKeyChange = (key: string) => {
        onChange({ ...node, key, value: '' });
    };

    const handleValueChange = (val: string) => {
        onChange({ ...node, value: val });
    };

    const handleBoolChange = (checked: boolean) => {
        onChange({ ...node, value: checked ? 'true' : 'false' });
    };

    // Determine input type based on key or current value
    const isBoolean = ['enableUnifiedPooling', 'selfRequestIfRiderIsDriver', 'enableForwardBatching', 'useOneToOneOsrmMapping'].includes(node.key);

    return (
        <div className="flex items-center gap-2 p-2 rounded-md border bg-card text-card-foreground shadow-sm mb-2">
            <div className="flex-1 grid grid-cols-[1fr,1.5fr] gap-2">
                {hasOptions ? (
                    <Select value={node.key} onValueChange={handleKeyChange}>
                        <SelectTrigger className="h-8">
                            <SelectValue placeholder="Parameter" />
                        </SelectTrigger>
                        <SelectContent>
                            {parameterOptions.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        className="h-8"
                        placeholder="Parameter Key"
                        value={node.key}
                        onChange={e => handleKeyChange(e.target.value)}
                    />
                )}

                {isBoolean ? (
                    <div className="flex items-center space-x-2 h-8">
                        <Switch
                            id={`switch-${node.id}`}
                            checked={node.value === 'true' || node.value === true}
                            onCheckedChange={handleBoolChange}
                        />
                        <Label htmlFor={`switch-${node.id}`}>{node.value === 'true' || node.value === true ? 'True' : 'False'}</Label>
                    </div>
                ) : (
                    <Input
                        className="h-8"
                        placeholder="Value"
                        value={typeof node.value === 'object' ? JSON.stringify(node.value) : node.value}
                        onChange={e => handleValueChange(e.target.value)}
                    />
                )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
