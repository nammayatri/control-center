
import { useState, useMemo, useEffect } from 'react';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { LogicEditor } from './components/LogicEditor';
import type { LogicNode } from './types/JsonLogicTypes';
import { exportToJson } from './utils/jsonLogicConverter';
import type { FilterOptions } from './components/ConditionBlock';
import { useAuth } from '../../context/AuthContext';
import { getSpecialLocationList } from '../../services/geospatial';
import { FileJson, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';

// Hardcoded vehicle types as per plan
const VEHICLE_TYPES = [
    'AUTO_RICKSHAW',
    'SEDAN',
    'SUV',
    'HATCHBACK',
    'TAXI',
    'TAXI_PLUS',
    'PREMIUM_SEDAN',
    'BLACK',
    'BLACK_XL',
    'BIKE',
    'DELIVERY_BIKE',
    'AMBULANCE_TAXI',
    'AMBULANCE_TAXI_OXY',
    'AMBULANCE_AC',
    'AMBULANCE_AC_OXY',
    'AMBULANCE_VENTILATOR',
    'SUV_PLUS',
];

export function LogicBuilderPage() {
    const { merchants, cities, currentMerchant } = useAuth();
    const [rootNodes, setRootNodes] = useState<LogicNode[]>([]);
    const [previewJson, setPreviewJson] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [areas, setAreas] = useState<{ label: string, value: string }[]>([]);

    // Prepare Filter Options
    const filterOptions: FilterOptions = useMemo(() => {
        // Merchants
        const merchantOpts = merchants.map(m => ({ label: m.name, value: m.id }));

        // Cities
        const cityOpts = (cities || []).map(c => ({ label: c.name, value: c.id }));

        const vehicleOpts = VEHICLE_TYPES.map(v => ({ label: v.replace(/_/g, ' '), value: v }));

        return {
            merchants: merchantOpts,
            cities: cityOpts,
            vehicles: vehicleOpts,
            areas: areas,
        };
    }, [merchants, cities, areas]);

    // Fetch areas when city changes
    const { currentCity } = useAuth();
    useEffect(() => {
        async function fetchAreas() {
            if (!currentMerchant || !currentCity) return;
            try {
                const locs = await getSpecialLocationList(currentMerchant.shortId, currentCity.name, { limit: 1000 });
                // contentId is the UUID, tag is usually 'Pickup' etc?
                // The JSON logic example uses `config.area.contents == "uuid"` and `config.area.tag == "Pickup"`
                // We'll focus on the UUID for the 'area.contents' filter.
                setAreas(locs.map(l => ({ label: l.locationName, value: l.id })));
            } catch (e) {
                console.error("Failed to fetch special locations", e);
            }
        }
        fetchAreas();
    }, [currentMerchant, currentCity]);

    const handleExport = () => {
        const json = exportToJson(rootNodes);
        setPreviewJson(JSON.stringify(json, null, 4));
        setIsPreviewOpen(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(previewJson);
        toast.success("Copied to clipboard");
    };

    return (
        <Page>
            <PageHeader
                title="JSON Logic Builder"
                description="Build complex parameter configuration logic visually."
            />
            <PageContent>
                <Card className="min-h-[600px] flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-muted/10">
                        <div>
                            <h3 className="font-medium">Logic Tree</h3>
                            <p className="text-sm text-muted-foreground">Define conditions and overrides. Default config is applied automatically.</p>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={handleExport} variant="outline" className="gap-2">
                                        <FileJson className="h-4 w-4" /> Preview JSON
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>JSON Output</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-auto bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm">
                                        <pre>{previewJson}</pre>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button onClick={handleCopy}>Copy JSON</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button onClick={handleExport} className="gap-2">
                                <Save className="h-4 w-4" /> Save / Export
                            </Button>
                        </div>
                    </div>
                    <CardContent className="flex-1 p-6">
                        <LogicEditor
                            nodes={rootNodes}
                            onChange={setRootNodes}
                            filterOptions={filterOptions}
                        />

                        {rootNodes.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg mt-4">
                                <p>Start by adding a condition or parameter override.</p>
                                <p className="text-sm mt-2">The root configuration is always applied first.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </PageContent>
        </Page>
    );
}
