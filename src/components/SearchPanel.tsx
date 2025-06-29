
import React, { useState } from 'react';
import { DataEntity } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Sparkles, Filter, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface SearchPanelProps {
  data: DataEntity[];
  onSearch: (query: string, results: any[]) => void;
}

interface QueryPattern {
  pattern: RegExp;
  processor: (match: RegExpMatchArray, data: DataEntity[]) => any[];
  description: string;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ data, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [queryInsights, setQueryInsights] = useState<string>('');

  // Enhanced query patterns for more sophisticated natural language processing
  const queryPatterns: QueryPattern[] = [
    {
      pattern: /(?:all|find|show|get)\s+(\w+)\s+(?:with|having|where)\s+(.+)/i,
      processor: (match, entities) => {
        const entityType = match[1];
        const condition = match[2];
        return processCondition(entityType, condition, entities);
      },
      description: "Find entities with specific conditions"
    },
    {
      pattern: /(\w+)\s+(?:with|having)\s+(\w+)\s+(?:more than|greater than|>)\s+(\d+)/i,
      processor: (match, entities) => {
        const entityType = match[1];
        const field = match[2];
        const value = match[3];
        return processComparison(entityType, field, '>', parseInt(value), entities);
      },
      description: "Find entities with numeric comparisons"
    },
    {
      pattern: /(\w+)\s+(?:with|having)\s+(\w+)\s+(?:less than|fewer than|<)\s+(\d+)/i,
      processor: (match, entities) => {
        const entityType = match[1];
        const field = match[2];
        const value = match[3];
        return processComparison(entityType, field, '<', parseInt(value), entities);
      },
      description: "Find entities with numeric comparisons"
    },
    {
      pattern: /(\w+)\s+(?:with|having)\s+(\w+)\s+(?:equal to|equals|=)\s+(.+)/i,
      processor: (match, entities) => {
        const entityType = match[1];
        const field = match[2];
        const value = match[3];
        return processComparison(entityType, field, '=', value.trim(), entities);
      },
      description: "Find entities with exact matches"
    },
    {
      pattern: /(\w+)\s+(?:in|from)\s+(?:group|team)\s+(\w+)/i,
      processor: (match, entities) => {
        const entityType = match[1];
        const groupName = match[2];
        return processGroupFilter(entityType, groupName, entities);
      },
      description: "Find entities in specific groups"
    },
    {
      pattern: /(\w+)\s+(?:available|working)\s+(?:in|during)\s+phase\s+(\d+)(?:\s+and\s+(\d+))?/i,
      processor: (match, entities) => {
        const entityType = match[1];
        const phase1 = match[2];
        const phase2 = match[3];
        const phases = [parseInt(phase1), phase2 ? parseInt(phase2) : null].filter(Boolean);
        return processPhaseFilter(entityType, phases, entities);
      },
      description: "Find entities available in specific phases"
    },
    {
      pattern: /(\w+)\s+(?:requiring|needing|with)\s+(?:skill|skills)\s+(.+)/i,
      processor: (match, entities) => {
        const entityType = match[1];
        const skills = match[2];
        return processSkillFilter(entityType, skills, entities);
      },
      description: "Find entities with specific skills"
    }
  ];

  const processCondition = (entityType: string, condition: string, entities: DataEntity[]): any[] => {
    const targetEntity = findEntityByType(entityType, entities);
    if (!targetEntity) return [];

    const conditionLower = condition.toLowerCase();
    
    // Priority level conditions
    if (conditionLower.includes('priority') && conditionLower.includes('5')) {
      return targetEntity.data.filter(item => item.PriorityLevel === 5 || item.PriorityLevel === '5');
    }
    
    if (conditionLower.includes('high priority')) {
      return targetEntity.data.filter(item => parseInt(item.PriorityLevel) >= 4);
    }

    // Duration conditions
    if (conditionLower.includes('duration') && (conditionLower.includes('more than') || conditionLower.includes('longer than'))) {
      const durationMatch = condition.match(/(\d+)/);
      if (durationMatch) {
        const threshold = parseInt(durationMatch[1]);
        return targetEntity.data.filter(item => parseInt(item.Duration) > threshold);
      }
    }

    // Skills conditions
    if (conditionLower.includes('skills') && conditionLower.includes('more than')) {
      const countMatch = condition.match(/(\d+)/);
      if (countMatch) {
        const threshold = parseInt(countMatch[1]);
        return targetEntity.data.filter(item => {
          if (!item.Skills) return false;
          const skillCount = item.Skills.split(',').length;
          return skillCount > threshold;
        });
      }
    }

    return [];
  };

  const processComparison = (entityType: string, field: string, operator: string, value: any, entities: DataEntity[]): any[] => {
    const targetEntity = findEntityByType(entityType, entities);
    if (!targetEntity) return [];

    const fieldMap: Record<string, string> = {
      'priority': 'PriorityLevel',
      'duration': 'Duration',
      'skills': 'Skills',
      'load': 'MaxLoadPerPhase',
      'concurrent': 'MaxConcurrent'
    };

    const actualField = fieldMap[field.toLowerCase()] || field;

    return targetEntity.data.filter(item => {
      const itemValue = item[actualField];
      if (itemValue === undefined) return false;

      if (typeof value === 'number') {
        const numValue = parseInt(itemValue);
        if (isNaN(numValue)) return false;
        
        switch (operator) {
          case '>': return numValue > value;
          case '<': return numValue < value;
          case '=': return numValue === value;
          default: return false;
        }
      } else {
        return itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
      }
    });
  };

  const processGroupFilter = (entityType: string, groupName: string, entities: DataEntity[]): any[] => {
    const targetEntity = findEntityByType(entityType, entities);
    if (!targetEntity) return [];

    return targetEntity.data.filter(item => {
      const groupField = item.GroupTag || item.WorkerGroup || item.Category;
      return groupField && groupField.toLowerCase().includes(groupName.toLowerCase());
    });
  };

  const processPhaseFilter = (entityType: string, phases: number[], entities: DataEntity[]): any[] => {
    const targetEntity = findEntityByType(entityType, entities);
    if (!targetEntity) return [];

    return targetEntity.data.filter(item => {
      if (item.AvailableSlots) {
        try {
          const availableSlots = JSON.parse(item.AvailableSlots);
          return phases.every(phase => availableSlots.includes(phase));
        } catch {
          return false;
        }
      }
      if (item.PreferredPhases) {
        try {
          const preferredPhases = JSON.parse(item.PreferredPhases);
          return phases.some(phase => preferredPhases.includes(phase));
        } catch {
          return false;
        }
      }
      return false;
    });
  };

  const processSkillFilter = (entityType: string, skillsText: string, entities: DataEntity[]): any[] => {
    const targetEntity = findEntityByType(entityType, entities);
    if (!targetEntity) return [];

    const requiredSkills = skillsText.split(/\s+(?:or|and)\s+/).map(s => s.trim().toLowerCase());

    return targetEntity.data.filter(item => {
      const itemSkills = (item.Skills || item.RequiredSkills || '').toLowerCase();
      return requiredSkills.some(skill => itemSkills.includes(skill));
    });
  };

  const findEntityByType = (entityType: string, entities: DataEntity[]): DataEntity | null => {
    const typeMap: Record<string, string> = {
      'client': 'clients',
      'clients': 'clients',
      'worker': 'workers',
      'workers': 'workers',
      'employee': 'workers',
      'employees': 'workers',
      'task': 'tasks',
      'tasks': 'tasks',
      'job': 'tasks',
      'jobs': 'tasks'
    };

    const targetType = typeMap[entityType.toLowerCase()];
    return entities.find(e => e.type === targetType) || null;
  };

  const processNaturalLanguageQuery = async (query: string) => {
    setIsSearching(true);
    setQueryInsights('');
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      let results: any[] = [];
      let insight = '';

      // Try pattern matching
      for (const pattern of queryPatterns) {
        const match = query.match(pattern.pattern);
        if (match) {
          results = pattern.processor(match, data);
          insight = `Processed using pattern: ${pattern.description}`;
          break;
        }
      }

      // Fallback to simple text search if no patterns match
      if (results.length === 0) {
        const queryLower = query.toLowerCase();
        data.forEach(entity => {
          const matchingRows = entity.data.filter(row =>
            Object.values(row).some(value =>
              value?.toString().toLowerCase().includes(queryLower)
            )
          );
          results.push(...matchingRows.map(row => ({ ...row, _entityType: entity.type })));
        });
        insight = 'Used fallback text search across all entities';
      }

      // Add entity type to results if not present
      results = results.map(result => ({
        ...result,
        _entityType: result._entityType || 'unknown'
      }));

      setSearchResults(results);
      setQueryInsights(insight);
      onSearch(query, results);
      
      if (results.length === 0) {
        toast.info("No results found. Try rephrasing your query or use the suggested patterns.");
      } else {
        toast.success(`Found ${results.length} result(s) using AI parsing`);
      }
    } catch (error) {
      toast.error("Error processing search query");
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.warning("Please enter a search query");
      return;
    }
    processNaturalLanguageQuery(searchQuery);
  };

  const handleExampleClick = (example: string) => {
    setSearchQuery(example);
    processNaturalLanguageQuery(example);
  };

  const getEntityColor = (entityType: string) => {
    const colors = {
      clients: 'bg-blue-100 text-blue-800',
      workers: 'bg-green-100 text-green-800',
      tasks: 'bg-purple-100 text-purple-800'
    };
    return colors[entityType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Enhanced example queries
  const exampleQueries = [
    "All clients with priority level 5",
    "Workers with more than 3 skills",
    "Tasks with duration longer than 2 phases",
    "Clients in GroupA with high priority",
    "Workers available in phase 1 and 2",
    "Tasks requiring Python or JavaScript skills",
    "Workers from TechTeam group",
    "Tasks with duration less than 3",
    "Clients having priority equal to 4",
    "Workers with skills containing DevOps"
  ];

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span>Enhanced Natural Language Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Ask anything about your data... (e.g., 'Show me all high priority clients')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </span>
              )}
            </Button>
          </div>

          {queryInsights && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">{queryInsights}</span>
              </div>
            </div>
          )}

          {/* Example Queries */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">Try these example searches:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  className="text-xs"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Search Results</span>
              </span>
              <Badge variant="secondary">{searchResults.length} results</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {searchResults.map((result, index) => {
                  const entityType = (result as any)._entityType || 'unknown';
                  const columns = Object.keys(result).filter(key => key !== '_entityType');
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getEntityColor(entityType)}>
                          {entityType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Result #{index + 1}</span>
                      </div>
                      
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {columns.map((column) => (
                          <div key={column} className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">{column}</p>
                            <p className="text-sm break-words">
                              {result[column]?.toString() || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try rephrasing your query or use one of the example searches above.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
