import React, { useState } from 'react';
import { DataEntity, BusinessRule } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Trash2, Sparkles, Download } from 'lucide-react';
import { toast } from 'sonner';

interface RuleBuilderProps {
  data: DataEntity[];
  rules: BusinessRule[];
  onRuleAdd: (rule: BusinessRule) => void;
  onRuleUpdate: (rules: BusinessRule[]) => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ data, rules, onRuleAdd, onRuleUpdate }) => {
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleParameters, setRuleParameters] = useState<Record<string, any>>({});
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');

  // Get available options from data
  const getAvailableOptions = () => {
    const clientsEntity = data.find(d => d.type === 'clients');
    const workersEntity = data.find(d => d.type === 'workers');
    const tasksEntity = data.find(d => d.type === 'tasks');

    const taskIds = tasksEntity?.data.length > 0 ? tasksEntity.data.map(task => task.TaskID) : [];
    const clientGroups = clientsEntity?.data.length > 0 ? [...new Set(clientsEntity.data.map(client => client.GroupTag).filter(Boolean))] : [];
    const workerGroups = workersEntity?.data.length > 0 ? [...new Set(workersEntity.data.map(worker => worker.WorkerGroup).filter(Boolean))] : [];

    return { taskIds, clientGroups, workerGroups };
  };

  const { taskIds, clientGroups, workerGroups } = getAvailableOptions();

  const ruleTypes = [
    { id: 'coRun', name: 'Co-run Tasks', description: 'Tasks that must run together' },
    { id: 'slotRestriction', name: 'Slot Restriction', description: 'Minimum common slots for groups' },
    { id: 'loadLimit', name: 'Load Limit', description: 'Maximum slots per phase for workers' },
    { id: 'phaseWindow', name: 'Phase Window', description: 'Allowed phases for specific tasks' },
    { id: 'patternMatch', name: 'Pattern Match', description: 'Regex-based rules' },
    { id: 'precedence', name: 'Precedence Override', description: 'Rule priority settings' }
  ];

  const handleAddRule = () => {
    if (!selectedRuleType || !ruleName.trim()) {
      toast.error('Please select a rule type and provide a name');
      return;
    }

    const newRule: BusinessRule = {
      id: `rule-${Date.now()}`,
      type: selectedRuleType as any,
      name: ruleName,
      description: ruleDescription,
      parameters: ruleParameters
    };

    onRuleAdd(newRule);
    toast.success('Rule added successfully');

    // Reset form
    setSelectedRuleType('');
    setRuleName('');
    setRuleDescription('');
    setRuleParameters({});
  };

  const handleRemoveRule = (ruleId: string) => {
    const updatedRules = rules.filter(rule => rule.id !== ruleId);
    onRuleUpdate(updatedRules);
    toast.success('Rule removed');
  };

  const processNaturalLanguageRule = () => {
    if (!naturalLanguageRule.trim()) {
      toast.error('Please enter a rule description');
      return;
    }

    // Simple pattern matching - in a real app, this would use AI/NLP
    const ruleLower = naturalLanguageRule.toLowerCase();
    let suggestedRule: Partial<BusinessRule> = {};

    if (ruleLower.includes('together') || ruleLower.includes('co-run')) {
      suggestedRule = {
        type: 'coRun',
        name: 'Co-run Rule',
        description: naturalLanguageRule,
        parameters: { tasks: [] }
      };
    } else if (ruleLower.includes('load') || ruleLower.includes('limit')) {
      suggestedRule = {
        type: 'loadLimit',
        name: 'Load Limit Rule',
        description: naturalLanguageRule,
        parameters: { maxSlotsPerPhase: 5, workerGroup: '' }
      };
    } else if (ruleLower.includes('phase') || ruleLower.includes('window')) {
      suggestedRule = {
        type: 'phaseWindow',
        name: 'Phase Window Rule',
        description: naturalLanguageRule,
        parameters: { taskId: '', allowedPhases: [] }
      };
    } else {
      // Default to pattern match
      suggestedRule = {
        type: 'patternMatch',
        name: 'Custom Rule',
        description: naturalLanguageRule,
        parameters: { pattern: '', action: 'apply' }
      };
    }

    setSelectedRuleType(suggestedRule.type || '');
    setRuleName(suggestedRule.name || '');
    setRuleDescription(suggestedRule.description || '');
    setRuleParameters(suggestedRule.parameters || {});
    setNaturalLanguageRule('');

    toast.success('Rule interpreted! Please review and adjust the parameters.');
  };

  const exportRulesConfig = () => {
    const config = {
      rules: rules.map(rule => ({
        id: rule.id,
        type: rule.type,
        name: rule.name,
        description: rule.description,
        parameters: rule.parameters
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Rules configuration exported successfully');
  };

  const renderRuleParameters = () => {
    switch (selectedRuleType) {
      case 'coRun':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="corun-tasks">Select Tasks to Co-run</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select tasks..." />
                </SelectTrigger>
                <SelectContent>
                  {taskIds.map(taskId => (
                    <SelectItem key={taskId} value={taskId}>{taskId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'slotRestriction':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-type">Group Type</Label>
              <Select onValueChange={(value) => setRuleParameters({...ruleParameters, groupType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client Group</SelectItem>
                  <SelectItem value="worker">Worker Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="min-slots">Minimum Common Slots</Label>
              <Input
                id="min-slots"
                type="number"
                min="1"
                value={ruleParameters.minCommonSlots || ''}
                onChange={(e) => setRuleParameters({...ruleParameters, minCommonSlots: parseInt(e.target.value)})}
              />
            </div>
          </div>
        );

      case 'loadLimit':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="worker-group">Worker Group</Label>
              <Select onValueChange={(value) => setRuleParameters({...ruleParameters, workerGroup: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker group..." />
                </SelectTrigger>
                <SelectContent>
                  {workerGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="max-slots">Max Slots Per Phase</Label>
              <Input
                id="max-slots"
                type="number"
                min="1"
                value={ruleParameters.maxSlotsPerPhase || ''}
                onChange={(e) => setRuleParameters({...ruleParameters, maxSlotsPerPhase: parseInt(e.target.value)})}
              />
            </div>
          </div>
        );

      case 'phaseWindow':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-id">Task ID</Label>
              <Select onValueChange={(value) => setRuleParameters({...ruleParameters, taskId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task..." />
                </SelectTrigger>
                <SelectContent>
                  {taskIds.map(taskId => (
                    <SelectItem key={taskId} value={taskId}>{taskId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="allowed-phases">Allowed Phases (comma-separated)</Label>
              <Input
                id="allowed-phases"
                placeholder="e.g., 1,2,3"
                value={ruleParameters.allowedPhases?.join(',') || ''}
                onChange={(e) => setRuleParameters({
                  ...ruleParameters, 
                  allowedPhases: e.target.value.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
                })}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Select a rule type to configure parameters
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Rule Builder</TabsTrigger>
          <TabsTrigger value="natural">Natural Language</TabsTrigger>
          <TabsTrigger value="manage">Manage Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Create Business Rule</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="rule-type">Rule Type</Label>
                  <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="Enter rule name..."
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rule-description">Description (Optional)</Label>
                <Textarea
                  id="rule-description"
                  placeholder="Describe what this rule does..."
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                />
              </div>

              <div>
                <Label>Rule Parameters</Label>
                <div className="mt-2 p-4 border rounded-lg">
                  {renderRuleParameters()}
                </div>
              </div>

              <Button onClick={handleAddRule} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="natural" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span>Natural Language Rule Creator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="natural-rule">Describe your rule in plain English</Label>
                <Textarea
                  id="natural-rule"
                  placeholder="e.g., 'Tasks T1 and T2 should always run together' or 'Sales workers should not exceed 3 slots per phase'"
                  value={naturalLanguageRule}
                  onChange={(e) => setNaturalLanguageRule(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button onClick={processNaturalLanguageRule} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Convert to Rule
              </Button>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Example natural language rules:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>"Tasks should run together if they share common requirements"</li>
                  <li>"Limit each worker group to maximum 5 slots per phase"</li>
                  <li>"High priority tasks should only run in phases 1-3"</li>
                  <li>"Apply load balancing for GroupA workers"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Business Rules ({rules.length})</span>
                </CardTitle>
                <Button onClick={exportRulesConfig} disabled={rules.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Config
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rules created yet</h3>
                  <p className="text-muted-foreground">Create your first business rule using the builder or natural language tab.</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {rules.map(rule => (
                      <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{rule.type}</Badge>
                              <h3 className="font-medium">{rule.name}</h3>
                            </div>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRule(rule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {Object.keys(rule.parameters).length > 0 && (
                          <div className="text-xs">
                            <p className="font-medium mb-1">Parameters:</p>
                            <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                              {JSON.stringify(rule.parameters, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
