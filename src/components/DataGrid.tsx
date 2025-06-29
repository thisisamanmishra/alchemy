
import React, { useState, useMemo } from 'react';
import { DataEntity, ValidationError } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Edit, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataGridProps {
  entity: DataEntity;
  onDataUpdate: (updatedEntity: DataEntity) => void;
}

interface EditingCell {
  row: number;
  column: string;
  value: string;
}

export const DataGrid: React.FC<DataGridProps> = ({ entity, onDataUpdate }) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const columns = useMemo(() => {
    if (entity.data.length === 0) return [];
    return Object.keys(entity.data[0]);
  }, [entity.data]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return entity.data;
    
    return entity.data.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [entity.data, searchTerm]);

  const getCellError = (rowIndex: number, column: string): ValidationError | null => {
    return entity.errors.find(error => error.row === rowIndex + 1 && error.column === column) || null;
  };

  const getCellWarning = (rowIndex: number, column: string): ValidationError | null => {
    return entity.warnings.find(warning => warning.row === rowIndex + 1 && warning.column === column) || null;
  };

  const handleCellClick = (rowIndex: number, column: string, value: any) => {
    setEditingCell({
      row: rowIndex,
      column,
      value: value?.toString() || ''
    });
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    const updatedData = [...entity.data];
    updatedData[editingCell.row][editingCell.column] = editingCell.value;

    // Simple validation - you could expand this
    const updatedEntity = {
      ...entity,
      data: updatedData,
      // Re-run validation logic here
      errors: entity.errors, // For now, keeping existing errors
      warnings: entity.warnings
    };

    onDataUpdate(updatedEntity);
    setEditingCell(null);
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder={`Search ${entity.type}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{filteredData.length} of {entity.data.length} rows</span>
          {entity.errors.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {entity.errors.length} errors
            </Badge>
          )}
          {entity.warnings.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {entity.warnings.length} warnings
            </Badge>
          )}
        </div>
      </div>

      {/* Data Grid */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96 w-full">
            <div className="min-w-full">
              {/* Header */}
              <div className="grid gap-px bg-muted p-px" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))` }}>
                {columns.map((column) => (
                  <div
                    key={column}
                    className="bg-background p-3 font-medium text-sm border-r border-b"
                  >
                    {column}
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              {filteredData.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid gap-px bg-muted p-px"
                  style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))` }}
                >
                  {columns.map((column) => {
                    const cellError = getCellError(rowIndex, column);
                    const cellWarning = getCellWarning(rowIndex, column);
                    const isEditing = editingCell?.row === rowIndex && editingCell?.column === column;
                    const cellValue = row[column];

                    return (
                      <div
                        key={column}
                        className={cn(
                          "bg-background p-3 text-sm border-r border-b min-h-[48px] flex items-center",
                          cellError && "bg-red-50 border-red-200",
                          cellWarning && "bg-yellow-50 border-yellow-200",
                          !cellError && !cellWarning && "hover:bg-muted/50 cursor-pointer"
                        )}
                        onClick={() => !isEditing && handleCellClick(rowIndex, column, cellValue)}
                      >
                        {isEditing ? (
                          <div className="flex items-center space-x-2 w-full">
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              onKeyDown={handleKeyPress}
                              className="h-8 text-xs"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={handleCellSave}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCellCancel}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">
                              {cellValue?.toString() || ''}
                            </span>
                            <div className="flex items-center space-x-1">
                              {cellError && (
                                <div title={cellError.message}>
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                </div>
                              )}
                              {cellWarning && (
                                <div title={cellWarning.message}>
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                </div>
                              )}
                              {!cellError && !cellWarning && (
                                <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
