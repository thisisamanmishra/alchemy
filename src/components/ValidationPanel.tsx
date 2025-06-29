
import React, { useState } from 'react';
import { DataEntity, ValidationError } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Info, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationPanelProps {
  entities: DataEntity[];
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ entities }) => {
  const [selectedError, setSelectedError] = useState<ValidationError | null>(null);

  const allErrors = entities.flatMap(entity => 
    entity.errors.map(error => ({ ...error, entityType: entity.type, entityId: entity.id }))
  );
  
  const allWarnings = entities.flatMap(entity => 
    entity.warnings.map(warning => ({ ...warning, entityType: entity.type, entityId: entity.id }))
  );

  const errorsByType = allErrors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 
      <AlertTriangle className="h-4 w-4 text-red-500" /> : 
      <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'text-red-600' : 'text-yellow-600';
  };

  const getEntityColor = (entityType: string) => {
    const colors = {
      clients: 'bg-blue-100 text-blue-800',
      workers: 'bg-green-100 text-green-800',
      tasks: 'bg-purple-100 text-purple-800'
    };
    return colors[entityType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSuggestions = (error: ValidationError) => {
    const suggestions: Record<string, string[]> = {
      missing_column: [
        'Add the missing column to your data file',
        'Check if the column name is spelled correctly',
        'Ensure the column header matches expected format'
      ],
      missing_value: [
        'Fill in the empty cell with a valid value',
        'Check if this field is truly required for this record',
        'Use a default value if appropriate'
      ],
      invalid_range: [
        'Update the value to be within the valid range',
        'Check the documentation for acceptable values',
        'Consider if the range constraint is appropriate'
      ],
      invalid_json: [
        'Fix the JSON syntax (check brackets, quotes, commas)',
        'Validate JSON using an online JSON validator',
        'Consider simplifying the JSON structure'
      ],
      invalid_value: [
        'Replace with a valid value of the correct type',
        'Check the data type requirements',
        'Remove any special characters if not allowed'
      ]
    };

    return suggestions[error.type] || ['Review and correct the data value'];
  };

  if (allErrors.length === 0 && allWarnings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-600 mb-2">All validations passed!</h3>
          <p className="text-muted-foreground">Your data is clean and ready for rule configuration.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{allErrors.length}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{allWarnings.length}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{Object.keys(errorsByType).length}</p>
                <p className="text-sm text-muted-foreground">Error Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Validation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Validation Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="errors">
            <TabsList>
              <TabsTrigger value="errors" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Errors ({allErrors.length})</span>
              </TabsTrigger>
              <TabsTrigger value="warnings" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Warnings ({allWarnings.length})</span>
              </TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {allErrors.map((error, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors",
                        selectedError === error ? "border-red-300 bg-red-50" : "hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedError(selectedError === error ? null : error)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getSeverityIcon(error.severity)}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge className={getEntityColor((error as any).entityType)}>
                                {(error as any).entityType}
                              </Badge>
                              <span className="text-sm font-medium">
                                Row {error.row} • Column {error.column}
                              </span>
                            </div>
                            <p className={cn("text-sm", getSeverityColor(error.severity))}>
                              {error.message}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {error.type}
                        </Badge>
                      </div>

                      {selectedError === error && (
                        <div className="mt-4 p-3 bg-white rounded border space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center space-x-2">
                              <Info className="h-4 w-4" />
                              <span>Suggested Fixes</span>
                            </h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {getSuggestions(error).map((suggestion, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                  <span className="text-blue-500">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Button size="sm" variant="outline" className="w-full">
                            Apply Auto-Fix (Coming Soon)
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="warnings" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {allWarnings.map((warning, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(warning.severity)}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge className={getEntityColor((warning as any).entityType)}>
                              {(warning as any).entityType}
                            </Badge>
                            <span className="text-sm font-medium">
                              Row {warning.row} • Column {warning.column}
                            </span>
                          </div>
                          <p className={cn("text-sm", getSeverityColor(warning.severity))}>
                            {warning.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Error Types Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(errorsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Entity Status</h3>
                  <div className="space-y-2">
                    {entities.map((entity) => (
                      <div key={entity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={getEntityColor(entity.type)}>
                            {entity.type}
                          </Badge>
                          <span>{entity.data.length} rows</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {entity.errors.length > 0 && (
                            <Badge variant="destructive">{entity.errors.length} errors</Badge>
                          )}
                          {entity.warnings.length > 0 && (
                            <Badge variant="secondary">{entity.warnings.length} warnings</Badge>
                          )}
                          {entity.errors.length === 0 && entity.warnings.length === 0 && (
                            <Badge variant="default" className="bg-green-600">Clean</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
