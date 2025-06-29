
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sliders, TrendingUp, Target, Users } from 'lucide-react';

interface PrioritizationPanelProps {
  weights: Record<string, number>;
  onWeightsUpdate: (weights: Record<string, number>) => void;
}

const priorityCriteria = [
  {
    id: 'priorityLevel',
    name: 'Client Priority Level',
    description: 'Weight given to client priority ratings (1-5)',
    icon: Target,
    color: 'bg-blue-500'
  },
  {
    id: 'taskFulfillment',
    name: 'Task Fulfillment',
    description: 'Importance of completing requested tasks',
    icon: TrendingUp,
    color: 'bg-green-500'
  },
  {
    id: 'fairness',
    name: 'Fair Distribution',
    description: 'Ensuring equitable allocation across clients',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    id: 'efficiency',
    name: 'Resource Efficiency',
    description: 'Optimal use of worker capacity and skills',
    icon: Sliders,
    color: 'bg-orange-500'
  },
  {
    id: 'deadline',
    name: 'Deadline Urgency',
    description: 'Meeting time-sensitive requirements',
    icon: Target,
    color: 'bg-red-500'
  },
  {
    id: 'skillMatch',
    name: 'Skill Matching',
    description: 'Quality of worker-task skill alignment',
    icon: Users,
    color: 'bg-indigo-500'
  }
];

const presetProfiles = [
  {
    id: 'balanced',
    name: 'Balanced Approach',
    description: 'Equal weight to all criteria',
    weights: {
      priorityLevel: 50,
      taskFulfillment: 50,
      fairness: 50,
      efficiency: 50,
      deadline: 50,
      skillMatch: 50
    }
  },
  {
    id: 'priority-first',
    name: 'Priority First',
    description: 'High priority clients get preference',
    weights: {
      priorityLevel: 90,
      taskFulfillment: 70,
      fairness: 30,
      efficiency: 40,
      deadline: 60,
      skillMatch: 50
    }
  },
  {
    id: 'efficiency-focused',
    name: 'Efficiency Focused',
    description: 'Maximize resource utilization',
    weights: {
      priorityLevel: 40,
      taskFulfillment: 60,
      fairness: 40,
      efficiency: 90,
      deadline: 50,
      skillMatch: 80
    }
  },
  {
    id: 'fair-distribution',
    name: 'Fair Distribution',
    description: 'Ensure equitable treatment',
    weights: {
      priorityLevel: 30,
      taskFulfillment: 60,
      fairness: 90,
      efficiency: 50,
      deadline: 40,
      skillMatch: 50
    }
  }
];

export const PrioritizationPanel: React.FC<PrioritizationPanelProps> = ({ weights, onWeightsUpdate }) => {
  const [localWeights, setLocalWeights] = useState(weights);

  const handleWeightChange = (criteriaId: string, value: number[]) => {
    const newWeights = { ...localWeights, [criteriaId]: value[0] };
    setLocalWeights(newWeights);
    onWeightsUpdate(newWeights);
  };

  const applyPreset = (preset: typeof presetProfiles[0]) => {
    setLocalWeights(preset.weights);
    onWeightsUpdate(preset.weights);
  };

  const resetWeights = () => {
    const resetWeights = priorityCriteria.reduce((acc, criteria) => {
      acc[criteria.id] = 50;
      return acc;
    }, {} as Record<string, number>);
    setLocalWeights(resetWeights);
    onWeightsUpdate(resetWeights);
  };

  const chartData = priorityCriteria.map(criteria => ({
    name: criteria.name.split(' ')[0], // Shortened name for chart
    value: localWeights[criteria.id] || 50,
    fullName: criteria.name
  }));

  const totalWeight = Object.values(localWeights).reduce((sum, weight) => sum + weight, 0);
  const averageWeight = totalWeight / priorityCriteria.length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sliders">
        <TabsList>
          <TabsTrigger value="sliders">Weight Sliders</TabsTrigger>
          <TabsTrigger value="presets">Preset Profiles</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="sliders" className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{totalWeight}</p>
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{averageWeight.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Average Weight</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{priorityCriteria.length}</p>
                  <p className="text-sm text-muted-foreground">Criteria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight Sliders */}
          <div className="grid gap-6">
            {priorityCriteria.map(criteria => {
              const IconComponent = criteria.icon;
              const currentWeight = localWeights[criteria.id] || 50;
              
              return (
                <Card key={criteria.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${criteria.color}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">{criteria.name}</h3>
                            <p className="text-sm text-muted-foreground">{criteria.description}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                          {currentWeight}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low Priority</span>
                          <span>High Priority</span>
                        </div>
                        <Slider
                          value={[currentWeight]}
                          onValueChange={(value) => handleWeightChange(criteria.id, value)}
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>50</span>
                          <span>100</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex space-x-4">
            <Button onClick={resetWeights} variant="outline" className="flex-1">
              Reset to Default
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="presets" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {presetProfiles.map(preset => (
              <Card key={preset.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{preset.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                  
                  <div className="space-y-2">
                    {priorityCriteria.slice(0, 3).map(criteria => (
                      <div key={criteria.id} className="flex justify-between text-sm">
                        <span>{criteria.name}</span>
                        <Badge variant="outline">{preset.weights[criteria.id]}</Badge>
                      </div>
                    ))}
                    {priorityCriteria.length > 3 && (
                      <p className="text-xs text-muted-foreground">+ {priorityCriteria.length - 3} more criteria</p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => applyPreset(preset)} 
                    className="w-full"
                    variant="outline"
                  >
                    Apply Preset
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Priority Weights Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [value, props.payload.fullName]}
                      labelFormatter={() => ''}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weight Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priorityCriteria.map(criteria => {
                  const weight = localWeights[criteria.id] || 50;
                  const percentage = (weight / totalWeight) * 100;
                  
                  return (
                    <div key={criteria.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{criteria.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {weight} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${criteria.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
