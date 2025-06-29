
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DataEntity } from '@/pages/Index';
import { ValidationService } from '@/services/ValidationService';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface FileUploadProps {
  onDataUpload: (data: DataEntity[]) => void;
}

interface ParsedData {
  type: 'clients' | 'workers' | 'tasks';
  data: Record<string, any>[];
  originalHeaders: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataUpload }) => {
  const parseFile = useCallback(async (file: File): Promise<ParsedData | null> => {
    return new Promise((resolve) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const entityType = detectEntityType(file.name, result.data);
            if (entityType) {
              const mappedData = intelligentColumnMapping(result.data, entityType);
              resolve({
                type: entityType,
                data: mappedData,
                originalHeaders: result.meta.fields || []
              });
            } else {
              resolve(null);
            }
          },
          error: () => resolve(null)
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            const entityType = detectEntityType(file.name, jsonData);
            if (entityType && jsonData.length > 0) {
              const mappedData = intelligentColumnMapping(jsonData, entityType);
              resolve({
                type: entityType,
                data: mappedData,
                originalHeaders: Object.keys(jsonData[0] as object)
              });
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        resolve(null);
      }
    });
  }, []);

  const detectEntityType = (filename: string, data: any[]): 'clients' | 'workers' | 'tasks' | null => {
    const lowerFilename = filename.toLowerCase();
    
    // File name based detection
    if (lowerFilename.includes('client')) return 'clients';
    if (lowerFilename.includes('worker') || lowerFilename.includes('employee')) return 'workers';
    if (lowerFilename.includes('task') || lowerFilename.includes('job')) return 'tasks';
    
    // Column based detection
    if (data.length > 0) {
      const headers = Object.keys(data[0]).map(h => h.toLowerCase());
      
      if (headers.some(h => h.includes('clientid') || h.includes('client_id'))) return 'clients';
      if (headers.some(h => h.includes('workerid') || h.includes('worker_id') || h.includes('employeeid'))) return 'workers';
      if (headers.some(h => h.includes('taskid') || h.includes('task_id') || h.includes('jobid'))) return 'tasks';
      
      // Content based detection
      if (headers.includes('prioritylevel') || headers.includes('requestedtaskids')) return 'clients';
      if (headers.includes('skills') || headers.includes('availableslots')) return 'workers';
      if (headers.includes('duration') || headers.includes('requiredskills')) return 'tasks';
    }
    
    return null;
  };

  const intelligentColumnMapping = (data: any[], entityType: 'clients' | 'workers' | 'tasks'): any[] => {
    if (data.length === 0) return data;
    
    const columnMappings: Record<string, Record<string, string[]>> = {
      clients: {
        'ClientID': ['clientid', 'client_id', 'id', 'client'],
        'ClientName': ['clientname', 'client_name', 'name', 'company', 'organization'],
        'PriorityLevel': ['prioritylevel', 'priority_level', 'priority', 'urgency'],
        'RequestedTaskIDs': ['requestedtaskids', 'requested_task_ids', 'tasks', 'task_ids'],
        'GroupTag': ['grouptag', 'group_tag', 'group', 'category'],
        'AttributesJSON': ['attributesjson', 'attributes_json', 'attributes', 'metadata']
      },
      workers: {
        'WorkerID': ['workerid', 'worker_id', 'employeeid', 'employee_id', 'id'],
        'WorkerName': ['workername', 'worker_name', 'name', 'employee_name'],
        'Skills': ['skills', 'skill_set', 'capabilities', 'expertise'],
        'AvailableSlots': ['availableslots', 'available_slots', 'slots', 'availability'],
        'MaxLoadPerPhase': ['maxloadperphase', 'max_load_per_phase', 'max_load', 'capacity'],
        'WorkerGroup': ['workergroup', 'worker_group', 'group', 'team'],
        'QualificationLevel': ['qualificationlevel', 'qualification_level', 'level', 'seniority']
      },
      tasks: {
        'TaskID': ['taskid', 'task_id', 'id', 'job_id'],
        'TaskName': ['taskname', 'task_name', 'name', 'title'],
        'Category': ['category', 'type', 'classification'],
        'Duration': ['duration', 'time', 'length', 'phases'],
        'RequiredSkills': ['requiredskills', 'required_skills', 'skills', 'skill_requirements'],
        'PreferredPhases': ['preferredphases', 'preferred_phases', 'phases', 'timeline'],
        'MaxConcurrent': ['maxconcurrent', 'max_concurrent', 'concurrent', 'parallel']
      }
    };

    const mapping = columnMappings[entityType];
    const originalHeaders = Object.keys(data[0]);
    const headerMap: Record<string, string> = {};

    // Create mapping from original headers to standard headers
    Object.keys(mapping).forEach(standardHeader => {
      const possibleNames = mapping[standardHeader];
      const matchedHeader = originalHeaders.find(header => 
        possibleNames.some(possible => 
          header.toLowerCase().replace(/[^a-z0-9]/g, '') === possible.replace(/[^a-z0-9]/g, '')
        )
      );
      if (matchedHeader) {
        headerMap[matchedHeader] = standardHeader;
      }
    });

    // Transform data using the mapping
    return data.map(row => {
      const newRow: Record<string, any> = {};
      Object.keys(row).forEach(originalKey => {
        const standardKey = headerMap[originalKey] || originalKey;
        newRow[standardKey] = row[originalKey];
      });
      return newRow;
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedEntities: DataEntity[] = [];
    
    for (const file of acceptedFiles) {
      try {
        const parsedData = await parseFile(file);
        if (parsedData) {
          const entity: DataEntity = {
            id: `${parsedData.type}-${Date.now()}`,
            type: parsedData.type,
            data: parsedData.data,
            errors: [],
            warnings: []
          };
          uploadedEntities.push(entity);
          toast.success(`Successfully uploaded ${parsedData.type} data (${parsedData.data.length} rows)`);
        } else {
          toast.error(`Failed to parse ${file.name}. Please check the file format.`);
        }
      } catch (error) {
        toast.error(`Error processing ${file.name}: ${error}`);
      }
    }

    if (uploadedEntities.length > 0) {
      // Run comprehensive validation
      const validatedEntities = uploadedEntities.map(entity => {
        const errors = ValidationService.validateEntity(entity, uploadedEntities);
        return {
          ...entity,
          errors: errors.filter(e => e.severity === 'error'),
          warnings: errors.filter(e => e.severity === 'warning')
        };
      });

      // Add cross-entity validations
      const phaseSlotErrors = ValidationService.validatePhaseSlotSaturation(validatedEntities);
      if (phaseSlotErrors.length > 0) {
        const tasksEntity = validatedEntities.find(e => e.type === 'tasks');
        if (tasksEntity) {
          tasksEntity.warnings.push(...phaseSlotErrors.filter(e => e.severity === 'warning'));
          tasksEntity.errors.push(...phaseSlotErrors.filter(e => e.severity === 'error'));
        }
      }

      onDataUpload(validatedEntities);
    }
  }, [parseFile, onDataUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  return (
    <div className="space-y-4">
      <Card 
        {...getRootProps()} 
        className={`cursor-pointer transition-colors border-2 border-dashed ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-lg text-blue-600">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">Upload your data files</p>
              <p className="text-muted-foreground mb-4">
                Drag & drop CSV or XLSX files here, or click to select files
              </p>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-1">AI-Powered Parsing</p>
            <p className="text-blue-700">
              Our intelligent parser automatically detects file types and maps columns, 
              even with non-standard naming conventions. Supported formats: CSV, XLSX, XLS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
