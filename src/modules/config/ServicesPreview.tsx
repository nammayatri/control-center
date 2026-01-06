/**
 * Services Preview Component
 * 
 * Visual preview of how services will appear in the app:
 * 1. Homescreen - horizontal scrolling service cards
 * 2. Full Services Screen - Main service at top, Public/Private sections
 */

import { useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Smartphone, Monitor, Home, Grid3X3 } from 'lucide-react';

// ============================================
// Types
// ============================================

interface ServiceTag {
  type: string;
  text: string;
  bgColor: string;
  textColor: string;
}

interface ServiceOnClick {
  actionName: string;
  actionData?: string;
}

interface Service {
  serviceTag: string;
  allowGrow: boolean;
  category: string;
  serviceImageUrl?: string;
  tag?: ServiceTag;
  onClick?: ServiceOnClick;
}

interface ServicesPreviewProps {
  services: Service[];
  mainServiceTag: string;
}

// Service display names mapping
const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  CABS: 'Cabs',
  RENTAL: 'Rentals',
  INTERCITY: 'Intercity',
  METRO_V2: 'Metro',
  BUS: 'Bus',
  SUBWAY: 'Subway',
  INTERCITY_BUS: 'Intercity Bus',
  NAMMATRANSIT: 'Namma Transit',
  AMBULANCE: 'Ambulance',
  DELIVERY: 'Delivery',
  BIKE_TAXI: 'Bike Taxi',
};

// Placeholder service images (gradient colors based on service type)
const SERVICE_COLORS: Record<string, string> = {
  CABS: 'from-yellow-400 to-yellow-600',
  RENTAL: 'from-orange-400 to-orange-600',
  INTERCITY: 'from-green-400 to-green-600',
  METRO_V2: 'from-blue-400 to-blue-600',
  BUS: 'from-purple-400 to-purple-600',
  SUBWAY: 'from-indigo-400 to-indigo-600',
  INTERCITY_BUS: 'from-teal-400 to-teal-600',
  NAMMATRANSIT: 'from-gray-400 to-gray-600',
  AMBULANCE: 'from-red-400 to-red-600',
  DELIVERY: 'from-pink-400 to-pink-600',
  BIKE_TAXI: 'from-cyan-400 to-cyan-600',
};

// ============================================
// Homescreen Preview Component
// ============================================

function HomescreenPreview({ services }: ServicesPreviewProps) {
  // Show only first 3 services in order
  const homescreenServices = services.slice(0, 3);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 overflow-hidden">
      {/* Phone frame */}
      <div className="max-w-md mx-auto">
        {/* Header hint */}
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <Home className="h-3 w-3" />
          Homescreen Services Section
        </div>
        
        {/* Horizontal scrolling cards */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {homescreenServices.map((service) => (
            <div 
              key={service.serviceTag}
              className="flex-shrink-0 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 text-center"
            >
              {/* Service name */}
              <div className="font-semibold text-sm truncate mb-2">
                {SERVICE_DISPLAY_NAMES[service.serviceTag] || service.serviceTag}
              </div>
              
              {/* Tag badge area - fixed height to keep images aligned */}
              <div className="h-6 mb-2 flex items-center justify-center">
                {service.tag && (
                  <Badge 
                    className="text-xs"
                    style={{ 
                      backgroundColor: service.tag.bgColor, 
                      color: service.tag.textColor 
                    }}
                  >
                    {service.tag.text}
                  </Badge>
                )}
              </div>
              
              {/* Placeholder image */}
              <div 
                className={`w-full h-16 rounded-lg bg-gradient-to-br ${SERVICE_COLORS[service.serviceTag] || 'from-gray-400 to-gray-600'} flex items-center justify-center`}
              >
                <span className="text-white text-2xl">🚗</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* View all button */}
        <div className="mt-4">
          <button className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium">
            View all Services
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Full Services Screen Preview
// ============================================

function FullServicesPreview({ services, mainServiceTag }: ServicesPreviewProps) {
  const mainService = services.find(s => s.serviceTag === mainServiceTag);
  const publicServices = services.filter(s => s.category === 'PUBLIC' && s.serviceTag !== mainServiceTag);
  const privateServices = services.filter(s => s.category === 'PRIVATE');

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 overflow-hidden max-h-[500px] overflow-y-auto">
      {/* Header hint */}
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
        <Grid3X3 className="h-3 w-3" />
        Full Services Screen
      </div>
      
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow">
        {/* Main Service Banner (if allowGrow is true) */}
        {mainService && mainService.allowGrow && (
          <div className="relative">
            {/* Large service image placeholder */}
            <div 
              className={`h-40 bg-gradient-to-br ${SERVICE_COLORS[mainService.serviceTag] || 'from-gray-400 to-gray-600'} flex items-center justify-center`}
            >
              <span className="text-white text-6xl">🚌</span>
            </div>
          </div>
        )}

        {/* Public Section */}
        {(mainService?.category === 'PUBLIC' || publicServices.length > 0) && (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-3">Public</h3>
            
            {/* Main public service card (if main is public) */}
            {mainService && mainService.category === 'PUBLIC' && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">🚇</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Book a {SERVICE_DISPLAY_NAMES[mainService.serviceTag] || mainService.serviceTag}</div>
                    <div className="text-xs text-muted-foreground">3 stops near you</div>
                  </div>
                  <div 
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br ${SERVICE_COLORS[mainService.serviceTag] || 'from-gray-400 to-gray-600'} flex items-center justify-center`}
                  >
                    <span className="text-white text-2xl">🚇</span>
                  </div>
                </div>
                
                {/* Station examples */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span>→</span> Periyamedu
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>→</span> Park Station
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>→</span> Egmore Hotel Everest
                  </div>
                </div>
                
                {/* Action button */}
                <button className="w-full mt-4 py-3 bg-gray-800 text-white rounded-full text-sm font-medium">
                  Search {SERVICE_DISPLAY_NAMES[mainService.serviceTag] || mainService.serviceTag} or Destination
                </button>
              </div>
            )}
            
            {/* Other public services in grid */}
            {publicServices.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {publicServices.map((service) => (
                  <div 
                    key={service.serviceTag}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"
                  >
                    {/* Icon and service name */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-lg">🚇</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {SERVICE_DISPLAY_NAMES[service.serviceTag] || service.serviceTag}
                        </div>
                        <div className="text-xs text-muted-foreground">Station 0.3 km away</div>
                      </div>
                    </div>
                    
                    {/* Service image */}
                    <div 
                      className={`w-full h-20 rounded-lg bg-gradient-to-br ${SERVICE_COLORS[service.serviceTag] || 'from-gray-400 to-gray-600'} flex items-center justify-center`}
                    >
                      <span className="text-white text-3xl">🚇</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Private Section */}
        {privateServices.length > 0 && (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-3">Private</h3>
            
            {/* Grid of private services */}
            <div className="grid grid-cols-2 gap-3">
              {privateServices.map((service) => (
                <div 
                  key={service.serviceTag}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"
                >
                  {/* Service image */}
                  <div 
                    className={`w-full h-20 rounded-lg bg-gradient-to-br ${SERVICE_COLORS[service.serviceTag] || 'from-gray-400 to-gray-600'} flex items-center justify-center mb-2`}
                  >
                    <span className="text-white text-3xl">🚗</span>
                  </div>
                  
                  {/* Service name */}
                  <div className="font-medium text-sm">
                    {SERVICE_DISPLAY_NAMES[service.serviceTag] || service.serviceTag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Navigation Mock */}
        <div className="border-t flex items-center justify-around py-3 px-4">
          <div className="text-center">
            <div className="text-lg">🏠</div>
            <div className="text-xs text-muted-foreground">Home</div>
          </div>
          <div className="text-center">
            <div className="text-lg">⋮⋮</div>
            <div className="text-xs font-semibold">Services</div>
          </div>
          <div className="text-center">
            <div className="text-lg">⏺</div>
            <div className="text-xs text-muted-foreground">Live</div>
          </div>
          <div className="text-center">
            <div className="text-lg">🎫</div>
            <div className="text-xs text-muted-foreground">Ticket</div>
          </div>
          <div className="text-center">
            <div className="text-lg">👤</div>
            <div className="text-xs text-muted-foreground">Profile</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Preview Component
// ============================================

export function ServicesPreview({ services, mainServiceTag }: ServicesPreviewProps) {
  const [previewTab, setPreviewTab] = useState<'homescreen' | 'fullscreen'>('homescreen');

  if (services.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
        No services to preview
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          App Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'homescreen' | 'fullscreen')}>
          <TabsList className="mb-4">
            <TabsTrigger value="homescreen" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Homescreen
            </TabsTrigger>
            <TabsTrigger value="fullscreen" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Services Screen
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="homescreen">
            <HomescreenPreview services={services} mainServiceTag={mainServiceTag} />
          </TabsContent>
          
          <TabsContent value="fullscreen">
            <FullServicesPreview services={services} mainServiceTag={mainServiceTag} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
