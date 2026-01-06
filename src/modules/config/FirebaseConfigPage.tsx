/**
 * Firebase Remote Config Page - Business User Friendly
 * 
 * Features: Search, city filtering, simplified editing for business teams.
 */

import { useState, useEffect, useMemo } from 'react';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import {
  Upload,
  RefreshCw,
  Loader2,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Code,
  FileJson,
  Trash2,
  Edit2,
  Search,
  X,
  MapPin,
  Settings,
  List,
} from 'lucide-react';
import {
  useFirebaseProjects,
  useFirebaseConfig,
  usePublishFirebaseConfig,
  useValidateFirebaseConfig,
} from '../../hooks/useFirebaseConfig';
import type { RemoteConfigTemplate, RemoteConfigParameter } from '../../services/firebase';
import { FeatureFlagEditor, DefinedSection, DEFINED_PARAMETERS } from './FeatureFlagEditor';
import { ServicesEditor } from './ServicesEditor';
import { LanguagesEditor } from './LanguagesEditor';
import { BannersEditor } from './BannersEditor';
import { LottieEditor } from './LottieEditor';

// ============================================
// Parameter Editor Component
// ============================================

interface ParameterEditorProps {
  paramKey: string;
  parameter: RemoteConfigParameter;
  onUpdate: (key: string, parameter: RemoteConfigParameter) => void;
  onDelete: (key: string) => void;
  cityFilter?: string;
}

function ParameterEditor({ paramKey, parameter, onUpdate, onDelete, cityFilter }: Readonly<ParameterEditorProps>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(parameter.defaultValue?.value || '');
  const [editedDescription, setEditedDescription] = useState(parameter.description || '');

  const handleSave = () => {
    onUpdate(paramKey, {
      ...parameter,
      defaultValue: { value: editedValue },
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedValue(parameter.defaultValue?.value || '');
    setEditedDescription(parameter.description || '');
    setIsEditing(false);
  };

  // Check if this parameter contains city-specific data
  const containsCity = (value: string, city: string): boolean => {
    if (!city) return false;
    try {
      const parsed = JSON.parse(value);
      const jsonStr = JSON.stringify(parsed).toLowerCase();
      return jsonStr.includes(city.toLowerCase());
    } catch {
      return value.toLowerCase().includes(city.toLowerCase());
    }
  };

  const defaultValueContainsCity = cityFilter ? containsCity(parameter.defaultValue?.value || '', cityFilter) : false;
  const conditionalValuesWithCity = cityFilter && parameter.conditionalValues
    ? Object.entries(parameter.conditionalValues).filter(([, val]) => 
        containsCity(val.value || '', cityFilter)
      )
    : [];

  // If city filter is active and this parameter doesn't contain the city, don't show it
  if (cityFilter && !defaultValueContainsCity && conditionalValuesWithCity.length === 0) {
    return null;
  }

  return (
    <AccordionItem value={paramKey}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <FileJson className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{paramKey}</span>
          {cityFilter && (defaultValueContainsCity || conditionalValuesWithCity.length > 0) && (
            <Badge variant="default" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              Contains {cityFilter}
            </Badge>
          )}
          {parameter.conditionalValues && Object.keys(parameter.conditionalValues).length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {Object.keys(parameter.conditionalValues).length} conditions
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          {isEditing ? (
            <>
              <div>
                <label htmlFor="param-description" className="text-sm font-medium block mb-1">Description</label>
                <Input
                  id="param-description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Parameter description..."
                />
              </div>
              <div>
                <label htmlFor="param-default-value" className="text-sm font-medium block mb-1">Default Value</label>
                <Textarea
                  id="param-default-value"
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                  placeholder="Default value..."
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              {parameter.description && (
                <div className="mb-3">
                  <span className="text-sm text-muted-foreground italic">{parameter.description}</span>
                </div>
              )}
              
              {/* Default Value - Editable Input */}
              <div>
                <div className="text-sm font-medium mb-2">Default Value:</div>
                <Input
                  value={parameter.defaultValue?.value || ''}
                  onChange={(e) => {
                    onUpdate(paramKey, {
                      ...parameter,
                      defaultValue: { value: e.target.value },
                    });
                  }}
                  className="font-mono text-sm"
                  placeholder="Enter default value..."
                />
              </div>

              {/* Conditional Values */}
              {parameter.conditionalValues && Object.keys(parameter.conditionalValues).length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Conditional Values:</div>
                  <div className="space-y-3">
                    {Object.entries(parameter.conditionalValues).map(([condition, value]) => {
                      const highlightCity = cityFilter && containsCity(value.value || '', cityFilter);
                      return (
                        <div 
                          key={condition} 
                          className={`p-3 rounded-md border ${highlightCity ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'}`}
                        >
                          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="font-medium">Condition:</span>
                            <span className="font-mono">{condition}</span>
                            {highlightCity && (
                              <Badge variant="default" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {cityFilter}
                              </Badge>
                            )}
                          </div>
                          <Input
                            value={value.value || ''}
                            onChange={(e) => {
                              onUpdate(paramKey, {
                                ...parameter,
                                conditionalValues: {
                                  ...parameter.conditionalValues,
                                  [condition]: { value: e.target.value },
                                },
                              });
                            }}
                            className="font-mono text-sm"
                            placeholder="Enter conditional value..."
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit Description
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(paramKey)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ============================================
// Main Component
// ============================================

export function FirebaseConfigPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'defined' | 'all' | 'json'>('defined');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [firebaseCondition, setFirebaseCondition] = useState<string>('default'); // Track Firebase condition
  const [publishSummary, setPublishSummary] = useState<{ parameterChanges: string[], isValidating: boolean, validationPassed: boolean | null }>({
    parameterChanges: [],
    isValidating: false,
    validationPassed: null,
  });

  // Hooks
  const { data: projects = [], isLoading: loadingProjects } = useFirebaseProjects();
  const {
    data: configResponse,
    isLoading: loadingConfig,
    error: configError,
    refetch: refetchConfig,
  } = useFirebaseConfig(selectedProjectId);
  const publishMutation = usePublishFirebaseConfig();
  const validateMutation = useValidateFirebaseConfig();

  // Track edited config
  const [editedTemplate, setEditedTemplate] = useState<RemoteConfigTemplate | null>(null);

  // Compute server config
  const serverTemplate = useMemo(() => configResponse?.template || null, [configResponse]);

  // Use edited or server template
  const currentTemplate = editedTemplate || serverTemplate;
  
  // Detect actual changes by comparing JSON strings
  const hasUnsavedChanges = useMemo(() => {
    if (!editedTemplate || !serverTemplate) return false;
    return JSON.stringify(editedTemplate) !== JSON.stringify(serverTemplate);
  }, [editedTemplate, serverTemplate]);

  // Reset edited template when project changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setEditedTemplate(null);
    if (selectedProjectId) {
      refetchConfig();
    }
  }, [selectedProjectId, refetchConfig]);

  // Initialize edited template when server config loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (serverTemplate && !editedTemplate) {
      setEditedTemplate(serverTemplate);
    }
  }, [serverTemplate, editedTemplate]);

  // Helper function to create parameter value handlers (eliminates duplicate code)
  const createParameterHandlers = (
    param: RemoteConfigParameter,
    originalParam: RemoteConfigParameter | undefined,
    paramKey: string,
    firebaseCondition: string
  ) => {
    const getValue = () => {
      if (firebaseCondition === 'default') {
        return param.defaultValue?.value || '{}';
      }
      const conditional = param.conditionalValues?.[firebaseCondition];
      return conditional?.value || param.defaultValue?.value || '{}';
    };

    const getOriginalValue = () => {
      if (!originalParam) return '{}';
      if (firebaseCondition === 'default') {
        return originalParam.defaultValue?.value || '{}';
      }
      const conditional = originalParam.conditionalValues?.[firebaseCondition];
      return conditional?.value || originalParam.defaultValue?.value || '{}';
    };

    const handleUpdate = (newValue: string) => {
      const updatedParam = { ...param };
      
      if (firebaseCondition === 'default') {
        updatedParam.defaultValue = { value: newValue };
      } else {
        updatedParam.conditionalValues = {
          ...updatedParam.conditionalValues,
          [firebaseCondition]: { value: newValue },
        };
      }
      
      handleParameterUpdate(paramKey, updatedParam);
    };

    const availableConditions = (currentTemplate?.conditions || []).filter(
      cond => param.conditionalValues?.[cond.name] !== undefined
    );

    return { getValue, getOriginalValue, handleUpdate, availableConditions };
  };

  // Filter parameters based on search query
  const filteredParameters = useMemo(() => {
    if (!currentTemplate?.parameters) return {};
    
    const params = currentTemplate.parameters;
    
    if (!searchQuery && !cityFilter) {
      return params;
    }

    return Object.entries(params).reduce((acc, [key, param]) => {
      // Check if parameter key matches search query
      const matchesSearch = !searchQuery || key.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (matchesSearch) {
        acc[key] = param;
      }
      
      return acc;
    }, {} as Record<string, RemoteConfigParameter>);
  }, [currentTemplate, searchQuery, cityFilter]);

  // Handle parameter update
  const handleParameterUpdate = (key: string, parameter: RemoteConfigParameter) => {
    if (!currentTemplate) return;

    // Check if parameter exists in a group
    let foundInGroup = false;
    let groupNameFound = '';
    
    if (currentTemplate.parameterGroups) {
      for (const [groupName, group] of Object.entries(currentTemplate.parameterGroups)) {
        if (group.parameters?.[key]) {
             foundInGroup = true;
             groupNameFound = groupName;
             break;
        }
      }
    }

    if (foundInGroup) {
        // Update inside the group
        setEditedTemplate({
            ...currentTemplate,
            parameterGroups: {
                ...currentTemplate.parameterGroups!,
                [groupNameFound]: {
                    ...currentTemplate.parameterGroups![groupNameFound],
                    parameters: {
                        ...currentTemplate.parameterGroups![groupNameFound].parameters,
                        [key]: parameter
                    }
                }
            }
        });
    } else {
        // Update in top-level parameters
        setEditedTemplate({
            ...currentTemplate,
            parameters: {
                ...currentTemplate.parameters,
                [key]: parameter,
            },
        });
    }
  };

  // Handle parameter delete
  const handleParameterDelete = (key: string) => {
    if (!currentTemplate?.parameters) return;
    const newParams = { ...currentTemplate.parameters };
    delete newParams[key];
    setEditedTemplate({
      ...currentTemplate,
      parameters: newParams,
    });
  };

  // Handle fetch/refresh
  const handleFetch = () => {
    setEditedTemplate(null);
    refetchConfig();
  };

  // Handle validate
  const handleValidate = async () => {
    if (!selectedProjectId || !currentTemplate) return;

    try {
      const result = await validateMutation.mutateAsync({
        projectId: selectedProjectId,
        template: currentTemplate,
      });

      if (result.valid) {
        toast.success('Configuration is valid');
      } else {
        toast.error(`Validation failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Validation failed');
    }
  };

  // Compute change summary between server and current template
  const computeChangeSummary = (): string[] => {
    if (!serverTemplate || !currentTemplate) return [];
    
    const changes: string[] = [];
    
    // Check top-level parameters
    const serverParams = serverTemplate.parameters || {};
    const currentParams = currentTemplate.parameters || {};
    
    // Check for modified/added parameters
    for (const key of Object.keys(currentParams)) {
      if (!serverParams[key]) {
        changes.push(`Added: ${key}`);
      } else if (JSON.stringify(serverParams[key]) !== JSON.stringify(currentParams[key])) {
        changes.push(`Modified: ${key}`);
      }
    }
    
    // Check for deleted parameters
    for (const key of Object.keys(serverParams)) {
      if (!currentParams[key]) {
        changes.push(`Deleted: ${key}`);
      }
    }
    
    // Check parameter groups
    const serverGroups = serverTemplate.parameterGroups || {};
    const currentGroups = currentTemplate.parameterGroups || {};
    
    for (const groupName of Object.keys(currentGroups)) {
      const serverGroup = serverGroups[groupName]?.parameters || {};
      const currentGroup = currentGroups[groupName]?.parameters || {};
      
      for (const key of Object.keys(currentGroup)) {
        if (!serverGroup[key]) {
          changes.push(`Added: ${groupName}/${key}`);
        } else if (JSON.stringify(serverGroup[key]) !== JSON.stringify(currentGroup[key])) {
          changes.push(`Modified: ${groupName}/${key}`);
        }
      }
      
      for (const key of Object.keys(serverGroup)) {
        if (!currentGroup[key]) {
          changes.push(`Deleted: ${groupName}/${key}`);
        }
      }
    }
    
    return changes;
  };

  // Handle prepare publish (validate and show dialog)
  const handlePreparePublish = async () => {
    if (!selectedProjectId || !currentTemplate) return;

    // Reset and start validation
    setPublishSummary({ parameterChanges: [], isValidating: true, validationPassed: null });
    setShowPublishDialog(true);

    try {
      // Validate config
      const result = await validateMutation.mutateAsync({
        projectId: selectedProjectId,
        template: currentTemplate,
      });

      // Compute changes
      const changes = computeChangeSummary();

      if (result.valid) {
        setPublishSummary({ parameterChanges: changes, isValidating: false, validationPassed: true });
      } else {
        setPublishSummary({ parameterChanges: changes, isValidating: false, validationPassed: false });
        toast.error(`Validation failed: ${result.error}`);
      }
    } catch (error) {
      setPublishSummary({ parameterChanges: [], isValidating: false, validationPassed: false });
      toast.error(error instanceof Error ? error.message : 'Validation failed');
    }
  };

  // Handle confirm publish (actual publish)
  const handleConfirmPublish = async () => {
    if (!selectedProjectId || !configResponse?.etag || !currentTemplate) return;

    try {
      await publishMutation.mutateAsync({
        projectId: selectedProjectId,
        template: currentTemplate,
        etag: configResponse.etag,
      });

      toast.success('Configuration published successfully');
      setShowPublishDialog(false);
      setEditedTemplate(null);
      setPublishSummary({ parameterChanges: [], isValidating: false, validationPassed: null });
      
      // Refetch config to show updated values
      refetchConfig();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publish failed');
    }
  };

  // Format version info
  const versionInfo = currentTemplate?.version;

  const parameterCount = Object.keys(filteredParameters).length;
  const totalParameters = Object.keys(currentTemplate?.parameters || {}).length;

  return (
    <Page>
      <PageHeader
        title="Firebase Remote Config"
        description="Manage Firebase Remote Config parameters for your city"
      />
      <PageContent>
        <div className="space-y-6">
          {/* Project Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Selection</CardTitle>
              <CardDescription>
                Select a Firebase project to manage its Remote Config
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  value={selectedProjectId || ''}
                  onValueChange={setSelectedProjectId}
                  disabled={loadingProjects}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedProjectId && (
                  <Button
                    variant="outline"
                    onClick={handleFetch}
                    disabled={loadingConfig}
                  >
                    {loadingConfig ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {loadingConfig ? 'Loading...' : 'Refresh'}
                  </Button>
                )}
              </div>

              {projects.length === 0 && !loadingProjects && (
                <div className="mt-4 p-4 bg-muted rounded-lg flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    No projects configured. Set VITE_FIREBASE_PROJECTS in your environment.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Config Editor */}
          {selectedProjectId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Remote Config</CardTitle>
                    {versionInfo && (
                      <CardDescription className="mt-1">
                        Version {versionInfo.versionNumber} • Last updated{' '}
                        {versionInfo.updateTime
                          ? new Date(versionInfo.updateTime).toLocaleString()
                          : 'Unknown'}
                        {versionInfo.updateUser?.email && ` by ${versionInfo.updateUser.email}`}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {configError ? (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      Failed to load config
                    </div>
                    <p className="mt-1 text-sm">
                      {configError instanceof Error ? configError.message : 'Unknown error'}
                    </p>
                  </div>
                ) : loadingConfig ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : currentTemplate ? (
                  <>
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'defined' | 'all' | 'json')}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="defined">
                          <Settings className="h-4 w-4 mr-2" />
                          Defined
                        </TabsTrigger>
                        <TabsTrigger value="all">
                          <List className="h-4 w-4 mr-2" />
                          All
                        </TabsTrigger>
                        <TabsTrigger value="json">
                          <Code className="h-4 w-4 mr-2" />
                          JSON View
                        </TabsTrigger>
                      </TabsList>

                      {/* Defined Tab - Business User Friendly */}
                      <TabsContent value="defined" className="space-y-8">
                        {/* App Level Section */}
                        <DefinedSection
                          title="App Level"
                          description="Configure app-wide settings and feature flags"
                        >
                          {DEFINED_PARAMETERS
                            .filter((p) => p.section === 'appLevel')
                            .map((config) => {
                              // Try to find parameter in multiple locations
                              let param: RemoteConfigParameter | undefined;
                              let paramPath = '';
                              
                              // 1. Check top-level parameters
                              param = currentTemplate.parameters[config.parameterKey];
                              if (param) {
                                paramPath = config.parameterKey;
                              }
                              
                              // 2. Check in parameterGroups (folders like ui_v2)
                              if (!param && currentTemplate.parameterGroups) {
                                for (const [groupName, group] of Object.entries(currentTemplate.parameterGroups)) {
                                  if (group.parameters?.[config.parameterKey]) {
                                    param = group.parameters[config.parameterKey];
                                    paramPath = `${groupName}/${config.parameterKey}`;
                                    break;
                                  }
                                }
                              }
                              
                              // Debug: Show message if parameter not found
                              if (!param) {
                                const groupNames = currentTemplate.parameterGroups 
                                  ? Object.keys(currentTemplate.parameterGroups).join(', ')
                                  : 'none';
                                return (
                                  <div key={config.parameterKey} className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500">
                                    <p className="font-medium text-yellow-700 dark:text-yellow-400">
                                      Parameter not found: <code className="font-mono">{config.parameterKey}</code>
                                    </p>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                                      Searched in: top-level parameters and parameterGroups
                                    </p>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                                      Available groups: {groupNames}
                                    </p>
                                  </div>
                                );
                              }

                              // Get parameter value based on Firebase condition
                              const getValue = () => {
                                if (firebaseCondition === 'default') {
                                  return param!.defaultValue?.value || '{}';
                                }
                                // Get conditional value
                                return param!.conditionalValues?.[firebaseCondition]?.value || param!.defaultValue?.value || '{}';
                              };

                              // Get original value for comparison
                              const getOriginalValue = () => {
                                let originalParam: RemoteConfigParameter | undefined;
                                
                                if (paramPath.includes('/')) {
                                  const [groupName, paramName] = paramPath.split('/');
                                  const originalGroup = serverTemplate?.parameterGroups?.[groupName];
                                  originalParam = originalGroup?.parameters?.[paramName];
                                } else {
                                  originalParam = serverTemplate?.parameters[config.parameterKey];
                                }
                                
                                if (!originalParam) return '{}';
                                
                                if (firebaseCondition === 'default') {
                                  return originalParam.defaultValue?.value || '{}';
                                }
                                return originalParam.conditionalValues?.[firebaseCondition]?.value || originalParam.defaultValue?.value || '{}';
                              };

                              const handleUpdate = (newValue: string) => {
                                if (paramPath.includes('/')) {
                                  // Update in parameterGroup
                                  const [groupName, paramName] = paramPath.split('/');
                                  const group = currentTemplate.parameterGroups?.[groupName];
                                  if (group) {
                                    const updatedParam = firebaseCondition === 'default'
                                      ? { ...param, defaultValue: { value: newValue } }
                                      : {
                                          ...param,
                                          conditionalValues: {
                                            ...param!.conditionalValues,
                                            [firebaseCondition]: { value: newValue },
                                          },
                                        };
                                    
                                    setEditedTemplate({
                                      ...currentTemplate,
                                      parameterGroups: {
                                        ...currentTemplate.parameterGroups,
                                        [groupName]: {
                                          ...group,
                                          parameters: {
                                            ...group.parameters,
                                            [paramName]: updatedParam,
                                          },
                                        },
                                      },
                                    });
                                  }
                                } else {
                                  // Update top-level parameter
                                  const updatedParam = firebaseCondition === 'default'
                                    ? { ...param!, defaultValue: { value: newValue } }
                                    : {
                                        ...param!,
                                        conditionalValues: {
                                          ...param!.conditionalValues,
                                          [firebaseCondition]: { value: newValue },
                                        },
                                      };
                                  
                                  handleParameterUpdate(config.parameterKey, updatedParam);
                                }
                              };

                              return (
                                <FeatureFlagEditor
                                  key={config.parameterKey}
                                  config={config}
                                  parameterValue={getValue()}
                                  originalValue={getOriginalValue()}
                                  onUpdate={handleUpdate}
                                  firebaseCondition={firebaseCondition}
                                  firebaseConditions={currentTemplate.conditions || []}
                                  onFirebaseConditionChange={setFirebaseCondition}
                                />
                              );
                            })}
                          
                          
                          {/* Languages Editor for allowed_languages */}
                          {(() => {
                            // Find allowed_languages in parameterGroups
                            let languagesParam: RemoteConfigParameter | undefined;
                            let languagesPath = '';
                            
                            // Check top-level
                            languagesParam = currentTemplate.parameters['allowed_languages'];
                            if (languagesParam) {
                              languagesPath = 'allowed_languages';
                            }
                            
                            // Check in parameterGroups
                            if (!languagesParam && currentTemplate.parameterGroups) {
                              for (const [groupName, group] of Object.entries(currentTemplate.parameterGroups)) {
                                if (group.parameters?.['allowed_languages']) {
                                  languagesParam = group.parameters['allowed_languages'];
                                  languagesPath = `${groupName}/allowed_languages`;
                                  break;
                                }
                              }
                            }
                            
                            if (!languagesParam) return null;
                            
                            const getValue = () => {
                              if (firebaseCondition === 'default') {
                                return languagesParam.defaultValue?.value || '{}';
                              }
                              return languagesParam.conditionalValues?.[firebaseCondition]?.value || languagesParam.defaultValue?.value || '{}';
                            };
                            
                            const getOriginalValue = () => {
                              let originalParam: RemoteConfigParameter | undefined;
                              
                              if (languagesPath.includes('/')) {
                                const [groupName] = languagesPath.split('/');
                                const originalGroup = serverTemplate?.parameterGroups?.[groupName];
                                originalParam = originalGroup?.parameters?.['allowed_languages'];
                              } else {
                                originalParam = serverTemplate?.parameters['allowed_languages'];
                              }
                              
                              if (!originalParam) return '{}';
                              
                              if (firebaseCondition === 'default') {
                                return originalParam.defaultValue?.value || '{}';
                              }
                              return originalParam.conditionalValues?.[firebaseCondition]?.value || originalParam.defaultValue?.value || '{}';
                            };
                            
                            const handleUpdate = (newValue: string) => {
                              if (languagesPath.includes('/')) {
                                const [groupName, paramName] = languagesPath.split('/');
                                const group = currentTemplate.parameterGroups?.[groupName];
                                if (group) {
                                  const updatedParam = firebaseCondition === 'default'
                                    ? { ...languagesParam, defaultValue: { value: newValue } }
                                    : {
                                        ...languagesParam,
                                        conditionalValues: {
                                          ...languagesParam.conditionalValues,
                                          [firebaseCondition]: { value: newValue },
                                        },
                                      };
                                  
                                  setEditedTemplate({
                                    ...currentTemplate,
                                    parameterGroups: {
                                      ...currentTemplate.parameterGroups,
                                      [groupName]: {
                                        ...group,
                                        parameters: {
                                          ...group.parameters,
                                          [paramName]: updatedParam,
                                        },
                                      },
                                    },
                                  });
                                }
                              } else {
                                const updatedParam = firebaseCondition === 'default'
                                  ? { ...languagesParam, defaultValue: { value: newValue } }
                                  : {
                                      ...languagesParam,
                                      conditionalValues: {
                                        ...languagesParam.conditionalValues,
                                        [firebaseCondition]: { value: newValue },
                                      },
                                    };
                                
                                handleParameterUpdate('allowed_languages', updatedParam);
                              }
                            };
                            
                            // Filter conditions to only show those with data for this parameter
                            const availableConditions = (currentTemplate.conditions || []).filter(
                              cond => languagesParam.conditionalValues?.[cond.name] !== undefined
                            );
                            
                            return (
                              <LanguagesEditor
                                parameterValue={getValue()}
                                originalValue={getOriginalValue()}
                                onUpdate={handleUpdate}
                                firebaseCondition={firebaseCondition}
                                firebaseConditions={availableConditions}
                                onFirebaseConditionChange={setFirebaseCondition}
                              />
                            );
                          })()}
                        </DefinedSection>

                        {/* Homescreen Section - Services and Banners */}
                        <DefinedSection
                          title="Homescreen"
                          description="Configure homescreen elements, services, and banners"
                        >
                          {/* Services Editor for enabled_services_v3 */}
                          {(() => {
                            // Find enabled_services_v3 in parameterGroups
                            let servicesParam: RemoteConfigParameter | undefined;
                            let servicesPath = '';
                            
                            // Check top-level
                            servicesParam = currentTemplate.parameters['enabled_services_v3'];
                            if (servicesParam) {
                              servicesPath = 'enabled_services_v3';
                            }
                            
                            // Check in parameterGroups
                            if (!servicesParam && currentTemplate.parameterGroups) {
                              for (const [groupName, group] of Object.entries(currentTemplate.parameterGroups)) {
                                if (group.parameters?.['enabled_services_v3']) {
                                  servicesParam = group.parameters['enabled_services_v3'];
                                  servicesPath = `${groupName}/enabled_services_v3`;
                                  break;
                                }
                              }
                            }
                            
                            if (!servicesParam) return null;
                            
                            const getValue = () => {
                              if (firebaseCondition === 'default') {
                                return servicesParam.defaultValue?.value || '{}';
                              }
                              return servicesParam.conditionalValues?.[firebaseCondition]?.value || servicesParam.defaultValue?.value || '{}';
                            };
                            
                            const getOriginalValue = () => {
                              let originalParam: RemoteConfigParameter | undefined;
                              
                              if (servicesPath.includes('/')) {
                                const [groupName] = servicesPath.split('/');
                                const originalGroup = serverTemplate?.parameterGroups?.[groupName];
                                originalParam = originalGroup?.parameters?.['enabled_services_v3'];
                              } else {
                                originalParam = serverTemplate?.parameters['enabled_services_v3'];
                              }
                              
                              if (!originalParam) return '{}';
                              
                              if (firebaseCondition === 'default') {
                                return originalParam.defaultValue?.value || '{}';
                              }
                              return originalParam.conditionalValues?.[firebaseCondition]?.value || originalParam.defaultValue?.value || '{}';
                            };
                            
                            const handleUpdate = (newValue: string) => {
                              if (servicesPath.includes('/')) {
                                const [groupName, paramName] = servicesPath.split('/');
                                const group = currentTemplate.parameterGroups?.[groupName];
                                if (group) {
                                  const updatedParam = firebaseCondition === 'default'
                                    ? { ...servicesParam, defaultValue: { value: newValue } }
                                    : {
                                        ...servicesParam,
                                        conditionalValues: {
                                          ...servicesParam.conditionalValues,
                                          [firebaseCondition]: { value: newValue },
                                        },
                                      };
                                  
                                  setEditedTemplate({
                                    ...currentTemplate,
                                    parameterGroups: {
                                      ...currentTemplate.parameterGroups,
                                      [groupName]: {
                                        ...group,
                                        parameters: {
                                          ...group.parameters,
                                          [paramName]: updatedParam,
                                        },
                                      },
                                    },
                                  });
                                }
                              } else {
                                const updatedParam = firebaseCondition === 'default'
                                  ? { ...servicesParam, defaultValue: { value: newValue } }
                                  : {
                                      ...servicesParam,
                                      conditionalValues: {
                                        ...servicesParam.conditionalValues,
                                        [firebaseCondition]: { value: newValue },
                                      },
                                    };
                                
                                handleParameterUpdate('enabled_services_v3', updatedParam);
                              }
                            };
                            
                            // Filter conditions to only show those with data for this parameter
                            const availableConditions = (currentTemplate.conditions || []).filter(
                              cond => servicesParam.conditionalValues?.[cond.name] !== undefined
                            );
                            
                            return (
                              <ServicesEditor
                                parameterValue={getValue()}
                                originalValue={getOriginalValue()}
                                onUpdate={handleUpdate}
                                firebaseCondition={firebaseCondition}
                                firebaseConditions={availableConditions}
                                onFirebaseConditionChange={setFirebaseCondition}
                              />
                            );
                          })()}

                          {/* Banners Editor for carousel_banner_config */}
                          {(() => {
                            // Look for carousel_banner_config in parameters
                            const paramKey = 'carousel_banner_config';
                            const param = currentTemplate.parameters?.[paramKey] || 
                              Object.values(currentTemplate.parameterGroups || {})
                                .flatMap(g => Object.entries(g.parameters || {}))
                                .find(([key]) => key === paramKey)?.[1];
                            
                            const originalParam = serverTemplate?.parameters?.[paramKey] ||
                              Object.values(serverTemplate?.parameterGroups || {})
                                .flatMap(g => Object.entries(g.parameters || {}))
                                .find(([key]) => key === paramKey)?.[1];
                            
                            if (!param) {
                              return (
                                <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
                                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>carousel_banner_config parameter not found</p>
                                </div>
                              );
                            }

                            // Use helper to get parameter handlers
                            const { getValue, getOriginalValue, handleUpdate, availableConditions } = 
                              createParameterHandlers(param, originalParam, paramKey, firebaseCondition);
                            
                            return (
                              <BannersEditor
                                parameterValue={getValue()}
                                originalValue={getOriginalValue()}
                                onUpdate={handleUpdate}
                                firebaseCondition={firebaseCondition}
                                firebaseConditions={availableConditions}
                                onFirebaseConditionChange={setFirebaseCondition}
                              />
                            );
                          })()}

                          {/* Lottie Animation Editor for city_lottie_config */}
                          {(() => {
                            // Look for city_lottie_config in parameters
                            const paramKey = 'city_lottie_config';
                            const param = currentTemplate.parameters?.[paramKey] || 
                              Object.values(currentTemplate.parameterGroups || {})
                                .flatMap(g => Object.entries(g.parameters || {}))
                                .find(([key]) => key === paramKey)?.[1];
                            
                            const originalParam = serverTemplate?.parameters?.[paramKey] ||
                              Object.values(serverTemplate?.parameterGroups || {})
                                .flatMap(g => Object.entries(g.parameters || {}))
                                .find(([key]) => key === paramKey)?.[1];
                            
                            if (!param) {
                              return null; // Don't show if parameter doesn't exist
                            }

                            // Use helper to get parameter handlers
                            const { getValue, getOriginalValue, handleUpdate, availableConditions } = 
                              createParameterHandlers(param, originalParam, paramKey, firebaseCondition);
                            
                            return (
                              <LottieEditor
                                parameterValue={getValue()}
                                originalValue={getOriginalValue()}
                                onUpdate={handleUpdate}
                                firebaseCondition={firebaseCondition}
                                firebaseConditions={availableConditions}
                                onFirebaseConditionChange={setFirebaseCondition}
                              />
                            );
                          })()}
                        </DefinedSection>
                      </TabsContent>

                      {/* All Tab - Original Structured View */}
                      <TabsContent value="all" className="space-y-6">
                        {/* Search and Filters */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Search & Filters</CardTitle>
                            <CardDescription>
                              Find parameters by name or filter by city
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Parameter Search */}
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search parameters..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-9 pr-9"
                                />
                                {searchQuery && (
                                  <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              {/* City Filter */}
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Filter by city (e.g., Bangalore, Delhi)..."
                                  value={cityFilter}
                                  onChange={(e) => setCityFilter(e.target.value)}
                                  className="pl-9 pr-9"
                                />
                                {cityFilter && (
                                  <button
                                    onClick={() => setCityFilter('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {(searchQuery || cityFilter) && (
                              <div className="mt-3 text-sm text-muted-foreground">
                                Showing {parameterCount} of {totalParameters} parameters
                                {cityFilter && ` containing "${cityFilter}"`}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Parameters Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                              <FileJson className="h-4 w-4" />
                              Parameters ({parameterCount})
                            </h3>
                          </div>
                          
                          {parameterCount === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No parameters found matching your search criteria</p>
                            </div>
                          ) : (
                            <Accordion type="multiple" className="w-full">
                              {Object.entries(filteredParameters).map(([key, param]) => (
                                <ParameterEditor
                                  key={key}
                                  paramKey={key}
                                  parameter={param}
                                  onUpdate={handleParameterUpdate}
                                  onDelete={handleParameterDelete}
                                  cityFilter={cityFilter}
                                />
                              ))}
                            </Accordion>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="json">
                        <textarea
                          className="w-full h-[500px] font-mono text-sm p-4 border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
                          value={JSON.stringify(currentTemplate, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setEditedTemplate(parsed);
                            } catch {
                              // Invalid JSON, ignore
                            }
                          }}
                          spellCheck={false}
                        />
                      </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={handleValidate}
                        disabled={!hasUnsavedChanges || validateMutation.isPending}
                      >
                        {validateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Validate
                      </Button>

                      <Button
                        onClick={handlePreparePublish}
                        disabled={!hasUnsavedChanges || publishMutation.isPending || validateMutation.isPending}
                      >
                        {(publishMutation.isPending || validateMutation.isPending) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Publish
                      </Button>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Publish Confirmation Dialog */}
        <AlertDialog open={showPublishDialog} onOpenChange={(open) => {
          if (!open) {
            setPublishSummary({ parameterChanges: [], isValidating: false, validationPassed: null });
          }
          setShowPublishDialog(open);
        }}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Publish Remote Config</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  {/* Validation Status */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      if (publishSummary.isValidating) {
                        return (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-sm">Validating configuration...</span>
                          </>
                        );
                      }
                      if (publishSummary.validationPassed === true) {
                        return (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Validation passed</span>
                          </>
                        );
                      }
                      if (publishSummary.validationPassed === false) {
                        return (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600">Validation failed</span>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Changes Summary */}
                  {publishSummary.parameterChanges.length > 0 && (
                    <div className="border rounded-md p-3 bg-muted/50 max-h-48 overflow-y-auto">
                      <div className="text-sm font-medium mb-2">Changes Summary ({publishSummary.parameterChanges.length})</div>
                      <ul className="text-sm space-y-1">
                        {publishSummary.parameterChanges.map((change, idx) => {
                          // Determine change type icon
                          let changeIcon: React.ReactNode;
                          if (change.startsWith('Added:')) {
                            changeIcon = <span className="text-green-600">+</span>;
                          } else if (change.startsWith('Deleted:')) {
                            changeIcon = <span className="text-red-600">-</span>;
                          } else {
                            changeIcon = <span className="text-yellow-600">~</span>;
                          }

                          return (
                            <li key={idx} className="flex items-center gap-2">
                              {changeIcon}
                              <span className="font-mono text-xs">{change.replace(/^(Added|Deleted|Modified): /, '')}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Warning */}
                  {publishSummary.validationPassed && (
                    <div className="text-sm text-muted-foreground">
                      This will immediately affect all apps using this Firebase project's Remote Config.
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmPublish}
                disabled={publishMutation.isPending || !publishSummary.validationPassed}
              >
                {publishMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Publish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContent>
    </Page>
  );
}

export default FirebaseConfigPage;
