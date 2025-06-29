
import { DataEntity, ValidationError } from '@/pages/Index';

export class ValidationService {
  static validateEntity(entity: DataEntity, allEntities: DataEntity[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    switch (entity.type) {
      case 'clients':
        return this.validateClients(entity, allEntities);
      case 'workers':
        return this.validateWorkers(entity, allEntities);
      case 'tasks':
        return this.validateTasks(entity, allEntities);
      default:
        return errors;
    }
  }

  private static validateClients(entity: DataEntity, allEntities: DataEntity[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredColumns = ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag'];
    const tasksEntity = allEntities.find(e => e.type === 'tasks');
    const validTaskIds = new Set(tasksEntity?.data.map(task => task.TaskID) || []);
    const seenIds = new Set();

    // Check required columns
    this.checkRequiredColumns(entity, requiredColumns, errors);

    entity.data.forEach((row, index) => {
      const rowNum = index + 1;

      // Duplicate ID check
      if (seenIds.has(row.ClientID)) {
        errors.push({
          row: rowNum,
          column: 'ClientID',
          type: 'duplicate_id',
          message: `Duplicate ClientID: ${row.ClientID}`,
          severity: 'error'
        });
      } else if (row.ClientID) {
        seenIds.add(row.ClientID);
      }

      // Missing required values
      if (!row.ClientID) {
        errors.push({
          row: rowNum,
          column: 'ClientID',
          type: 'missing_value',
          message: 'ClientID is required',
          severity: 'error'
        });
      }

      // Priority level validation
      const priority = parseInt(row.PriorityLevel);
      if (isNaN(priority) || priority < 1 || priority > 5) {
        errors.push({
          row: rowNum,
          column: 'PriorityLevel',
          type: 'invalid_range',
          message: 'PriorityLevel must be between 1 and 5',
          severity: 'error'
        });
      }

      // Validate JSON
      if (row.AttributesJSON) {
        try {
          JSON.parse(row.AttributesJSON);
        } catch {
          errors.push({
            row: rowNum,
            column: 'AttributesJSON',
            type: 'invalid_json',
            message: 'Invalid JSON format in AttributesJSON',
            severity: 'error'
          });
        }
      }

      // Validate requested task IDs
      if (row.RequestedTaskIDs) {
        const taskIds = row.RequestedTaskIDs.split(',').map((id: string) => id.trim());
        taskIds.forEach((taskId: string) => {
          if (!validTaskIds.has(taskId)) {
            errors.push({
              row: rowNum,
              column: 'RequestedTaskIDs',
              type: 'unknown_reference',
              message: `Unknown TaskID reference: ${taskId}`,
              severity: 'error'
            });
          }
        });
      }
    });

    return errors;
  }

  private static validateWorkers(entity: DataEntity, allEntities: DataEntity[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredColumns = ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase'];
    const seenIds = new Set();

    // Check required columns
    this.checkRequiredColumns(entity, requiredColumns, errors);

    entity.data.forEach((row, index) => {
      const rowNum = index + 1;

      // Duplicate ID check
      if (seenIds.has(row.WorkerID)) {
        errors.push({
          row: rowNum,
          column: 'WorkerID',
          type: 'duplicate_id',
          message: `Duplicate WorkerID: ${row.WorkerID}`,
          severity: 'error'
        });
      } else if (row.WorkerID) {
        seenIds.add(row.WorkerID);
      }

      // Missing required values
      if (!row.WorkerID) {
        errors.push({
          row: rowNum,
          column: 'WorkerID',
          type: 'missing_value',
          message: 'WorkerID is required',
          severity: 'error'
        });
      }

      // Validate AvailableSlots
      if (row.AvailableSlots) {
        try {
          const slots = JSON.parse(row.AvailableSlots);
          if (!Array.isArray(slots)) {
            throw new Error('Not an array');
          }
          slots.forEach((slot: any) => {
            if (!Number.isInteger(slot) || slot < 1) {
              throw new Error('Invalid slot number');
            }
          });

          // Check overloaded workers
          const maxLoad = parseInt(row.MaxLoadPerPhase);
          if (!isNaN(maxLoad) && slots.length < maxLoad) {
            errors.push({
              row: rowNum,
              column: 'MaxLoadPerPhase',
              type: 'overloaded_worker',
              message: `MaxLoadPerPhase (${maxLoad}) exceeds available slots (${slots.length})`,
              severity: 'warning'
            });
          }
        } catch {
          errors.push({
            row: rowNum,
            column: 'AvailableSlots',
            type: 'malformed_list',
            message: 'AvailableSlots must be a valid JSON array of phase numbers',
            severity: 'error'
          });
        }
      }

      // Validate MaxLoadPerPhase
      const maxLoad = parseInt(row.MaxLoadPerPhase);
      if (isNaN(maxLoad) || maxLoad < 1) {
        errors.push({
          row: rowNum,
          column: 'MaxLoadPerPhase',
          type: 'invalid_range',
          message: 'MaxLoadPerPhase must be a positive integer',
          severity: 'error'
        });
      }
    });

    return errors;
  }

  private static validateTasks(entity: DataEntity, allEntities: DataEntity[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredColumns = ['TaskID', 'TaskName', 'Duration', 'RequiredSkills', 'MaxConcurrent'];
    const seenIds = new Set();
    const workersEntity = allEntities.find(e => e.type === 'workers');
    const allWorkerSkills = new Set();

    // Collect all worker skills
    workersEntity?.data.forEach(worker => {
      if (worker.Skills) {
        worker.Skills.split(',').forEach((skill: string) => {
          allWorkerSkills.add(skill.trim());
        });
      }
    });

    // Check required columns
    this.checkRequiredColumns(entity, requiredColumns, errors);

    entity.data.forEach((row, index) => {
      const rowNum = index + 1;

      // Duplicate ID check
      if (seenIds.has(row.TaskID)) {
        errors.push({
          row: rowNum,
          column: 'TaskID',
          type: 'duplicate_id',
          message: `Duplicate TaskID: ${row.TaskID}`,
          severity: 'error'
        });
      } else if (row.TaskID) {
        seenIds.add(row.TaskID);
      }

      // Missing required values
      if (!row.TaskID) {
        errors.push({
          row: rowNum,
          column: 'TaskID',
          type: 'missing_value',
          message: 'TaskID is required',
          severity: 'error'
        });
      }

      // Duration validation
      const duration = parseInt(row.Duration);
      if (isNaN(duration) || duration < 1) {
        errors.push({
          row: rowNum,
          column: 'Duration',
          type: 'invalid_range',
          message: 'Duration must be a positive integer',
          severity: 'error'
        });
      }

      // MaxConcurrent validation
      const maxConcurrent = parseInt(row.MaxConcurrent);
      if (isNaN(maxConcurrent) || maxConcurrent < 1) {
        errors.push({
          row: rowNum,
          column: 'MaxConcurrent',
          type: 'invalid_range',
          message: 'MaxConcurrent must be a positive integer',
          severity: 'error'
        });
      }

      // Skill coverage validation
      if (row.RequiredSkills) {
        const requiredSkills = row.RequiredSkills.split(',').map((skill: string) => skill.trim());
        const uncoveredSkills = requiredSkills.filter(skill => !allWorkerSkills.has(skill));
        
        if (uncoveredSkills.length > 0) {
          errors.push({
            row: rowNum,
            column: 'RequiredSkills',
            type: 'skill_coverage',
            message: `No workers have these required skills: ${uncoveredSkills.join(', ')}`,
            severity: 'warning'
          });
        }

        // Max-concurrency feasibility check
        const qualifiedWorkers = workersEntity?.data.filter(worker => {
          if (!worker.Skills) return false;
          const workerSkills = worker.Skills.split(',').map((s: string) => s.trim());
          return requiredSkills.some(reqSkill => workerSkills.includes(reqSkill));
        }) || [];

        if (qualifiedWorkers.length < maxConcurrent) {
          errors.push({
            row: rowNum,
            column: 'MaxConcurrent',
            type: 'max_concurrency_feasibility',
            message: `MaxConcurrent (${maxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
            severity: 'warning'
          });
        }
      }

      // Validate PreferredPhases
      if (row.PreferredPhases) {
        try {
          const phases = JSON.parse(row.PreferredPhases);
          if (!Array.isArray(phases)) {
            throw new Error('Not an array');
          }
          phases.forEach((phase: any) => {
            if (!Number.isInteger(phase) || phase < 1) {
              throw new Error('Invalid phase number');
            }
          });
        } catch {
          errors.push({
            row: rowNum,
            column: 'PreferredPhases',
            type: 'malformed_list',
            message: 'PreferredPhases must be a valid JSON array of phase numbers',
            severity: 'error'
          });
        }
      }
    });

    return errors;
  }

  private static checkRequiredColumns(entity: DataEntity, requiredColumns: string[], errors: ValidationError[]) {
    if (entity.data.length === 0) return;
    
    const availableColumns = Object.keys(entity.data[0]);
    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
    
    missingColumns.forEach(column => {
      errors.push({
        row: 1,
        column,
        type: 'missing_column',
        message: `Required column '${column}' is missing`,
        severity: 'error'
      });
    });
  }

  static validatePhaseSlotSaturation(allEntities: DataEntity[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const tasksEntity = allEntities.find(e => e.type === 'tasks');
    const workersEntity = allEntities.find(e => e.type === 'workers');

    if (!tasksEntity || !workersEntity) return errors;

    // Calculate phase capacity and demand
    const phaseCapacity: Record<number, number> = {};
    const phaseDemand: Record<number, number> = {};

    // Calculate worker capacity per phase
    workersEntity.data.forEach(worker => {
      if (worker.AvailableSlots) {
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          const maxLoad = parseInt(worker.MaxLoadPerPhase) || 1;
          slots.forEach((phase: number) => {
            phaseCapacity[phase] = (phaseCapacity[phase] || 0) + maxLoad;
          });
        } catch {
          // Skip malformed data
        }
      }
    });

    // Calculate task demand per phase
    tasksEntity.data.forEach((task, index) => {
      if (task.PreferredPhases && task.Duration) {
        try {
          const phases = JSON.parse(task.PreferredPhases);
          const duration = parseInt(task.Duration);
          phases.forEach((phase: number) => {
            phaseDemand[phase] = (phaseDemand[phase] || 0) + duration;
          });
        } catch {
          errors.push({
            row: index + 1,
            column: 'PreferredPhases',
            type: 'phase_slot_saturation',
            message: 'Cannot calculate phase demand due to malformed PreferredPhases',
            severity: 'warning'
          });
        }
      }
    });

    // Check for saturation
    Object.keys(phaseDemand).forEach(phaseStr => {
      const phase = parseInt(phaseStr);
      const demand = phaseDemand[phase];
      const capacity = phaseCapacity[phase] || 0;
      
      if (demand > capacity) {
        errors.push({
          row: 1,
          column: 'Phase Analysis',
          type: 'phase_slot_saturation',
          message: `Phase ${phase} is oversaturated: demand (${demand}) > capacity (${capacity})`,
          severity: 'warning'
        });
      }
    });

    return errors;
  }
}
