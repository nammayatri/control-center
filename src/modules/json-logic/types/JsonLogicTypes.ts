
export type LogicOperator = '==' | '!=' | '<=' | '>=' | 'in';

// A simple comparison: { variable op value }
export interface SimpleComparison {
  variable: string;
  operator: LogicOperator;
  value: any;
}

// A predicate that can be simple or grouped (AND/OR)
export interface PredicateGroup {
  groupOperator: 'and' | 'or';
  predicates: Predicate[];
}

export type Predicate = SimpleComparison | PredicateGroup;

// Helper to check type
export function isPredicateGroup(p: Predicate): p is PredicateGroup {
  return 'groupOperator' in p;
}

// The "Condition" node in our UI tree
export interface LogicCondition {
  id: string;
  type: 'condition';
  predicate: Predicate; // Can be simple or grouped
  thenBlock: LogicNode[]; // recursive list of nodes
  elseBlock: LogicNode[]; // recursive list of nodes
}

// The "Parameter Set" node in our UI tree
export interface LogicParameter {
  id: string;
  type: 'parameter';
  key: string;
  value: any; // string, number, boolean, object
}

export type LogicNode = LogicCondition | LogicParameter;

// Parameters that can be configured
export const ALLOWED_PARAMETERS = [
  'driverBatchSize',
  'minRadiusOfSearch',
  'radiusStepSize',
  'maxRadiusOfSearch',
  'actualDistanceThreshold',
  'maxNumberOfBatches',
  'maxParallelSearchRequests',
  'poolSortingType',
  'singleBatchProcessTime',
  'enableUnifiedPooling',
  'distanceBasedBatchSplit',
  // Derived from Haskell type but simplified for UI list
  'batchSizeOnRide',
  'driverRequestCountLimit',
  'driverQuoteLimit',
  'driverToDestinationDistanceThreshold',
  'driverToDestinationDuration',
  'radiusShrinkValueForDriversOnRide',
];

// Variables that can be filtered on
export const FILTER_VARIABLES = [
  { label: 'Vehicle Variant', value: 'extraDimensions.serviceTier', type: 'select' },
  { label: 'Trip Distance', value: 'extraDimensions.tripDistance', type: 'number' },
  { label: 'Merchant Operating City', value: 'config.merchantOperatingCityId', type: 'select' },
  { label: 'Merchant', value: 'config.merchantId', type: 'select' },
  { label: 'Trip Category', value: 'config.tripCategory', type: 'select' },
  { label: 'Area', value: 'config.area.tag', type: 'select' },
  { label: 'Area ID', value: 'config.area.contents', type: 'select' },
];

export const OPERATORS: { label: string; value: LogicOperator }[] = [
  { label: 'Equals (==)', value: '==' },
  { label: 'Not Equals (!=)', value: '!=' },
  { label: 'Less Than or Equal (<=)', value: '<=' },
  { label: 'Greater Than or Equal (>=)', value: '>=' },
  { label: 'In List (One Of)', value: 'in' },
];
