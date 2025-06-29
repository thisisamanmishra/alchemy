
import React from 'react';
import { DataEntity, BusinessRule } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExportPanelProps {
  data: DataEntity[];
  rules: BusinessRule[];
  weights: Record<string, number>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ data, rules, weights }) => {
  const exportCleanedData = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Add each entity as a separate sheet
    data.forEach(entity => {
      if (entity.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(entity.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, entity.type);
      }
    });

    // Export the workbook
    XLSX.writeFile(workbook, `cleaned-data-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Cleaned data exported successfully');
  };

  const exportRulesConfig = () => {
    const config = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        generatedBy: 'Data Alchemist'
      },
      businessRules: rules.map(rule => ({
        id: rule.id,
        type: rule.type,
        name: rule.name,
        description: rule.description,
        parameters: rule.parameters
      })),
      priorityWeights: weights,
      dataValidation: {
        totalErrors: data.reduce((sum, entity) => sum + entity.errors.length, 0),
        totalWarnings: data.reduce((sum, entity) => sum + entity.warnings.length, 0),
        entitiesProcessed: data.length
      }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rules-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Rules configuration exported successfully');
  };

  const exportAll = () => {
    exportCleanedData();
    setTimeout(() => {
      exportRulesConfig();
    }, 500);
    toast.success('Complete export package created');
  };

  const totalErrors = data.reduce((sum, entity) => sum + entity.errors.length, 0);
  const totalWarnings = data.reduce((sum, entity) => sum + entity.warnings.length, 0);
  const isDataClean = totalErrors === 0;

  return (
    <div className="space-y-6">
      {/* Export Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className={`h-5 w-5 ${isDataClean ? 'text-green-500' : 'text-yellow-500'}`} />
            <span>Export Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{data.length}</p>
              <p className="text-sm text-muted-foreground">Data Entities</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{rules.length}</p>
              <p className="text-sm text-muted-foreground">Business Rules</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{totalErrors}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{totalWarnings}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
          </div>
          
          {!isDataClean && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Your data contains validation errors. Please resolve them before exporting for optimal results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cleaned Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Cleaned Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your validated and cleaned data in Excel format. Each entity type will be in a separate sheet.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Included Sheets:</h4>
              {data.map(entity => (
                <div key={entity.id} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{entity.type}</span>
                  <Badge variant="outline">{entity.data.length} rows</Badge>
                </div>
              ))}
            </div>

            <Button 
              onClick={exportCleanedData} 
              className="w-full"
              disabled={data.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data (XLSX)
            </Button>
          </CardContent>
        </Card>

        {/* Rules Configuration Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-purple-500" />
              <span>Rules Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your business rules and priority weights as a JSON configuration file for downstream processing.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Configuration Includes:</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center justify-between">
                  <span>• Business Rules</span>
                  <Badge variant="outline">{rules.length}</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>• Priority Weights</span>
                  <Badge variant="outline">{Object.keys(weights).length}</Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>• Validation Summary</span>
                  <Badge variant="outline">Included</Badge>
                </li>
              </ul>
            </div>

            <Button 
              onClick={exportRulesConfig} 
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Rules (JSON)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Complete Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Complete Export Package</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Download both cleaned data and rules configuration in one go. Perfect for handoff to downstream allocation systems.
          </p>
          
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Data.xlsx</span>
            </div>
            <span className="text-muted-foreground">+</span>
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-purple-500" />
              <span>Rules.json</span>
            </div>
          </div>

          <Button 
            onClick={exportAll} 
            size="lg" 
            className="w-full max-w-md bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            disabled={data.length === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            Export Complete Package
          </Button>

          {!isDataClean && (
            <p className="text-xs text-yellow-600 mt-2">
              Note: Exporting with validation errors may affect downstream processing
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
