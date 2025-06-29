
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataGrid } from '@/components/DataGrid';
import { ValidationPanel } from '@/components/ValidationPanel';
import { SearchPanel } from '@/components/SearchPanel';
import { RuleBuilder } from '@/components/RuleBuilder';
import { PrioritizationPanel } from '@/components/PrioritizationPanel';
import { ExportPanel } from '@/components/ExportPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Upload, Search, Settings, Download, AlertTriangle, CheckCircle } from 'lucide-react';

export interface DataEntity {
  id: string;
  type: 'clients' | 'workers' | 'tasks';
  data: Record<string, any>[];
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  row: number;
  column: string;
  type: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface BusinessRule {
  id: string;
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedence';
  name: string;
  description: string;
  parameters: Record<string, any>;
}

const Index = () => {
  const [uploadedData, setUploadedData] = useState<DataEntity[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
  const [priorityWeights, setPriorityWeights] = useState<Record<string, number>>({});

  const totalErrors = uploadedData.reduce((sum, entity) => sum + entity.errors.length, 0);
  const totalWarnings = uploadedData.reduce((sum, entity) => sum + entity.warnings.length, 0);
  const isDataValid = totalErrors === 0;

  const handleDataUpload = (data: DataEntity[]) => {
    setUploadedData(data);
    if (data.length > 0) {
      setActiveTab('data');
    }
  };

  const handleSearch = (query: string, results: any[]) => {
    setSearchResults(results);
  };

  const handleRuleAdd = (rule: BusinessRule) => {
    setBusinessRules([...businessRules, rule]);
  };

  const handlePriorityUpdate = (weights: Record<string, number>) => {
    setPriorityWeights(weights);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Data Alchemist
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Resource Allocation Configurator</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {totalErrors > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{totalErrors} errors</span>
                </Badge>
              )}
              {totalWarnings > 0 && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{totalWarnings} warnings</span>
                </Badge>
              )}
              {isDataValid && uploadedData.length > 0 && (
                <Badge variant="default" className="flex items-center space-x-1 bg-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Ready to export</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-fit">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="data" disabled={uploadedData.length === 0} className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="search" disabled={uploadedData.length === 0} className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="rules" disabled={uploadedData.length === 0} className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Rules</span>
            </TabsTrigger>
            <TabsTrigger value="priority" disabled={uploadedData.length === 0} className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Priority</span>
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!isDataValid} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Data Files</CardTitle>
                <CardDescription>
                  Upload CSV or XLSX files for clients, workers, and tasks. Our AI will intelligently parse and validate your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onDataUpload={handleDataUpload} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid gap-6">
              {uploadedData.map((entity) => (
                <Card key={entity.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="capitalize">{entity.type} Data</CardTitle>
                      <div className="flex space-x-2">
                        {entity.errors.length > 0 && (
                          <Badge variant="destructive">{entity.errors.length} errors</Badge>
                        )}
                        {entity.warnings.length > 0 && (
                          <Badge variant="secondary">{entity.warnings.length} warnings</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DataGrid entity={entity} onDataUpdate={(updatedData) => {
                      setUploadedData(prev => prev.map(e => e.id === entity.id ? updatedData : e));
                    }} />
                  </CardContent>
                </Card>
              ))}
              {uploadedData.length > 0 && (
                <ValidationPanel entities={uploadedData} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <SearchPanel data={uploadedData} onSearch={handleSearch} />
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <RuleBuilder 
              data={uploadedData} 
              rules={businessRules}
              onRuleAdd={handleRuleAdd}
              onRuleUpdate={(rules) => setBusinessRules(rules)}
            />
          </TabsContent>

          <TabsContent value="priority" className="space-y-6">
            <PrioritizationPanel 
              weights={priorityWeights}
              onWeightsUpdate={handlePriorityUpdate}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportPanel 
              data={uploadedData}
              rules={businessRules}
              weights={priorityWeights}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
