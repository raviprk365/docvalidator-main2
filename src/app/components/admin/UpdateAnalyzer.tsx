"use client";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Control, Controller, useFieldArray, useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import { toast } from 'sonner';
import { analyzerSchema, getAllowedMethods, methods, primitiveTypes, type AnalyzerFormData } from './schemas/analyzerSchema';

interface Field {
  name: string;
  type: string;
  method: string;
  description: string;
  enum?: string[];
  properties?: Record<string, { type: string; method: string; description: string; enum?: string[] }>;
  items?: {
    type: string;
    method: string;
    properties?: Record<string, { type: string; method: string; description: string; enum?: string[] }>;
  };
}

interface Analyzer {
  analyzerId: string;
  displayName?: string;
  description?: string;
  fieldSchema?: {
    fields?: Record<string, unknown>;
  };
}


interface PropertyFieldArrayProps {
  control: Control<AnalyzerFormData>;
  fieldIndex: number;
  fieldType: string;
}



function PropertyFieldArray({ control, fieldIndex, fieldType }: PropertyFieldArrayProps) {
  const { fields: properties, append: appendProperty, remove: removeProperty } = useFieldArray({
    control,
    name: `fields.${fieldIndex}.properties`
  });

  const addProperty = () => {
    appendProperty({
      name: "",
      type: "String",
      method: "Extract",
      description: "",
      enum: []
    });
  };

  const removePropertyField = (propertyIndex: number) => {
    removeProperty(propertyIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium">
          {fieldType === 'Table' || fieldType === 'Fixed Table' ? 'Table Columns' : 'Properties'}
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProperty}
        >
          <Plus className="h-3 w-3 mr-1" />
          {fieldType === 'Table' || fieldType === 'Fixed Table' ? 'Add Column' : 'Add Property'}
        </Button>
      </div>

      {properties.map((property, propertyIndex) => (
        <div key={property.id} className="grid grid-cols-4 gap-2 p-2 border border-gray-200 rounded">
          <div>
            <label className="text-xs font-medium mb-1 block">Name</label>
            <Controller
              name={`fields.${fieldIndex}.properties.${propertyIndex}.name`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Property name"
                  className="text-xs"
                />
              )}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Type</label>
            <Controller
              name={`fields.${fieldIndex}.properties.${propertyIndex}.type`}
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["String", "Date", "Time", "Number", "Integer", "Boolean"].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Method</label>
            <Controller
              name={`fields.${fieldIndex}.properties.${propertyIndex}.method`}
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removePropertyField(propertyIndex)}
              className="h-8"
            >
              <Minus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UpdateAnalyzer() {
  const [availableAnalyzers, setAvailableAnalyzers] = useState<Analyzer[]>([]);
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAnalyzers, setLoadingAnalyzers] = useState(true);
  const [loadingAnalyzerDetails, setLoadingAnalyzerDetails] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);

  const {
    control,
    handleSubmit,
    reset
  } = useForm<AnalyzerFormData>({
    resolver: zodResolver(analyzerSchema),
    defaultValues: {
      analyzerId: "",
      displayName: "",
      description: "",
      baseAnalyzerId: "prebuilt-documentAnalyzer",
      fields: [
        { name: "", type: "String", method: "Extract", description: "", properties: [] }
      ]
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "fields"
  });

  const addField = () => {
    append({ name: "", type: "String", method: "Extract", description: "", properties: [] });
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Fetch available analyzers
  const fetchAnalyzers = async () => {
    setLoadingAnalyzers(true);
    try {
      const response = await fetch("/api/analyzers/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analyzers: ${response.status}`);
      }

      const data = await response.json();
      setAvailableAnalyzers(data.analyzers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analyzers");
    } finally {
      setLoadingAnalyzers(false);
    }
  };

  // Load analyzer details when selected
  const loadAnalyzerDetails = async (analyzerId: string) => {
    if (!analyzerId) {
      reset({
        analyzerId: "",
        displayName: "",
        description: "",
        baseAnalyzerId: "prebuilt-documentAnalyzer",
        fields: [
          { name: "", type: "String", method: "Extract", description: "", properties: [], enum: [""] }
        ]
      });
      setLoadingAnalyzerDetails(false);
      return;
    }

    setLoadingAnalyzerDetails(true);
    try {
      const response = await fetch(`/api/analyzers/${analyzerId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analyzer details: ${response.status}`);
      }

      const analyzer = await response.json();

      // Convert the analyzer data to react-hook-form format
      const formData: AnalyzerFormData = {
        analyzerId: analyzer.analyzerId || "",
        displayName: analyzer.displayName || "",
        description: analyzer.description || "",
        baseAnalyzerId: analyzer.baseAnalyzerId || "prebuilt-documentAnalyzer",
        fields: []
      };

      // Convert field schema to field array
      const analyzerFields: Field[] = [];

      // Map API types back to UI format
      const apiToUITypeMapping: Record<string, string> = {
        'string': 'String',
        'boolean': 'Boolean',
        'integer': 'Integer',
        'number': 'Number',
        'date': 'Date',
        'time': 'Time',
        'table': 'Table',
        'fixedTable': 'Fixed Table'
      };

      // Map API methods back to UI format
      const apiToUIMethodMapping: Record<string, string> = {
        'extract': 'Extract',
        'generate': 'Generate',
        'classify': 'Classify'
      };

      if (analyzer.fieldSchema?.fields) {
        Object.entries(analyzer.fieldSchema.fields).forEach(([fieldName, fieldConfig]: [string, Record<string, unknown>]) => {

          const fieldType = apiToUITypeMapping[fieldConfig.type] || fieldConfig.type || 'String';
          const fieldMethod = apiToUIMethodMapping[fieldConfig.method] || fieldConfig.method || 'Extract';
          const allowedMethods = getAllowedMethods(fieldType);

          // Ensure the method is valid for the field type, fallback to first allowed method
          const validMethod = allowedMethods.includes(fieldMethod) ? fieldMethod : allowedMethods[0];

          const fieldData: Field = {
            name: fieldName,
            type: fieldType,
            method: validMethod,
            description: fieldConfig.description || fieldConfig.fieldDescription || ""
          };

          // Load table columns or object properties
          const columnsOrProperties = fieldConfig.columns || fieldConfig.properties;
          if ((fieldType === 'Table' || fieldType === 'Fixed Table') && columnsOrProperties) {
            // Ensure all properties have required fields with defaults
            const processedProperties: Record<string, { type: string; method: string; description: string; enum?: string[] }> = {};
            Object.entries(columnsOrProperties).forEach(([propName, propConfig]: [string, Record<string, unknown>]) => {
              processedProperties[propName] = {
                type: apiToUITypeMapping[propConfig.type] || propConfig.type || 'String',
                method: apiToUIMethodMapping[propConfig.method] || propConfig.method || 'Extract',
                description: propConfig.description || '',
                ...(propConfig.enum && { enum: propConfig.enum })
              };
            });
            fieldData.properties = processedProperties;
          }

          // Load array items if field is array type
          if (fieldType === 'array' && fieldConfig.items) {
            fieldData.items = fieldConfig.items;
          }

          // Load enum if method is Classify
          if (validMethod === 'Classify' && fieldConfig.enum) {
            fieldData.enum = fieldConfig.enum;
          }

          analyzerFields.push(fieldData);
        });
      }

      // Convert analyzerFields to react-hook-form format and set the form data
      const convertedFields = analyzerFields.length > 0 ? analyzerFields.map(field => ({
        name: field.name,
        type: field.type,
        method: field.method,
        description: field.description,
        properties: field.properties ? Object.entries(field.properties).map(([name, prop]) => ({
          name,
          type: prop.type,
          method: prop.method,
          description: prop.description,
          enum: prop.enum || []
        })) : [],
        enum: field.enum || [""]
      })) : [
        { name: "", type: "String", method: "Extract", description: "", properties: [], enum: [""] }
      ];

      formData.fields = convertedFields;
      reset(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analyzer details");
    } finally {
      setLoadingAnalyzerDetails(false);
    }
  };




  const updateField = (index: number, property: keyof Field, value: string) => {
    const currentField = fields[index];
    const updatedField = { ...currentField };

    // Clear properties/items when type changes
    if (property === 'type') {
      // Clear object properties if not object/table type
      if (value !== 'object' && value !== 'Table' && value !== 'Fixed Table') {
        delete updatedField.properties;
      }
      // Clear array items if not array
      if (value !== 'array') {
        delete updatedField.items;
      }
      // Initialize array items
      if (value === 'array') {
        updatedField.items = { type: 'String', method: 'Extract' };
      }
      // Initialize table properties
      if ((value === 'Table' || value === 'Fixed Table') && !updatedField.properties) {
        updatedField.properties = [];
      }

      // Handle method changes for different types
      const allowedMethods = getAllowedMethods(value);
      if (value === 'Table' || value === 'Fixed Table') {
        // Table types don't have methods
        updatedField.method = '';
        delete updatedField.enum;
      } else if (!allowedMethods.includes(updatedField.method)) {
        updatedField.method = allowedMethods[0] || 'Extract';
        // Remove enum if changing away from classify, or initialize if changing to classify
        if (updatedField.method !== 'Classify') {
          delete updatedField.enum;
        } else {
          // Initialize enum for classify method
          if (!updatedField.enum || updatedField.enum.length === 0 ||
            (updatedField.enum.length === 1 && updatedField.enum[0].trim() === '')) {
            updatedField.enum = ['Option 1'];
          }
        }
      }
    }

    // Handle method changes
    if (property === 'method') {
      // If changing to classify, initialize enum if not exists
      if (value === 'Classify') {
        if (!updatedField.enum || updatedField.enum.length === 0 ||
          (updatedField.enum.length === 1 && updatedField.enum[0].trim() === '')) {
          updatedField.enum = ['Option 1'];
        }
      } else {
        // If changing away from classify, remove enum
        delete updatedField.enum;
      }
    }

    updatedField[property] = value;
    update(index, updatedField);
  };

  const onSubmit = async (data: AnalyzerFormData) => {
    // console.log("UpdateAnalyzer onSubmit called", { data, replaceMode, selectedAnalyzerId });
    setLoading(true);

    try {
      if (!selectedAnalyzerId) {
        throw new Error("Please select an analyzer to update");
      }

      let analyzerData: Record<string, unknown>;
      let method: string;

      if (replaceMode) {
        // Replace mode: Validate and send full analyzer configuration
        const validFields = data.fields.filter(field =>
          field.name &&
          field.name.trim() &&
          field.type
        );

        // Build field schema for API (same as CreateAnalyzer)
        const fieldSchema = {
          fields: validFields.reduce((acc, field) => {
            // Map UI types to Azure API types
            const typeMapping: Record<string, string> = {
              'String': 'string',
              'Boolean': 'boolean',
              'Integer': 'integer',
              'Number': 'number',
              'Date': 'date',
              'Time': 'string',
              'Table': 'table',
              'Fixed Table': 'fixedTable'
            };

            const fieldDef: Record<string, unknown> = {
              type: typeMapping[field.type] || field.type.toLowerCase(),
              description: field.description || ""
            };

            // Add method for non-table types
            if (field.type !== 'Table' && field.type !== 'Fixed Table' && field.method) {
              const methodMapping: Record<string, string> = {
                'Extract': 'extract',
                'Generate': 'generate',
                'Classify': 'classify'
              };
              fieldDef.method = methodMapping[field.method] || field.method.toLowerCase();
            }

            // Add enum for classify method (only for non-table types)
            if (field.method === 'Classify' && field.enum && field.type !== 'Table' && field.type !== 'Fixed Table') {
              const validEnums = field.enum.filter(e => e.trim());
              if (validEnums.length > 0) {
                fieldDef.enum = validEnums;
              }
            }

            // Add table columns
            if ((field.type === 'Table' || field.type === 'Fixed Table') && field.properties) {
              const validColumns = field.properties.filter(prop =>
                prop.name && prop.name.trim() && prop.type
              );
              const mappedColumns = validColumns.reduce((columnAcc: Record<string, unknown>, prop) => {
                const methodMapping: Record<string, string> = {
                  'Extract': 'extract',
                  'Generate': 'generate',
                  'Classify': 'classify'
                };

                const columnDef: Record<string, unknown> = {
                  type: typeMapping[prop.type] || prop.type.toLowerCase(),
                  description: prop.description || ""
                };

                // Add method for table columns
                if (prop.method) {
                  columnDef.method = methodMapping[prop.method] || prop.method.toLowerCase();
                }

                columnAcc[prop.name.trim()] = columnDef;
                return columnAcc;
              }, {});
              if (Object.keys(mappedColumns).length > 0) {
                fieldDef.columns = mappedColumns;
              }
            }

            acc[field.name.trim()] = fieldDef;
            return acc;
          }, {} as Record<string, Record<string, unknown>>)
        };

        analyzerData = {
          analyzerId: selectedAnalyzerId,
          displayName: data.displayName?.trim() || selectedAnalyzerId,
          description: data.description?.trim(),
          fieldSchema,
          baseAnalyzerId: data.baseAnalyzerId,
          config: {
            returnDetails: true
          }
        };
        method = "PUT";
      } else {
        // Update mode: Only send description
        analyzerData = {
          description: data.description?.trim()
        };
        method = "PATCH";
      }

      const url = replaceMode
        ? `/api/analyzers/${selectedAnalyzerId}?replace=true`
        : `/api/analyzers/${selectedAnalyzerId}`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analyzerData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update analyzer: ${response.status} - ${errorData}`);
      }

      toast.success(replaceMode ? "Analyzer replaced successfully!" : "Analyzer updated successfully!");

      // Scroll to top on success
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update analyzer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyzers();
  }, []);

  useEffect(() => {
    if (selectedAnalyzerId) {
      loadAnalyzerDetails(selectedAnalyzerId);
    }
  }, [selectedAnalyzerId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Update Analyzer</h2>
        <p className="text-muted-foreground">Select and modify an existing analyzer configuration.</p>
      </div>


      {/* Replace Mode Toggle */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="replace-mode"
              checked={replaceMode}
              onCheckedChange={(checked) => setReplaceMode(!!checked)}
            />
            <div className="flex-1">
              <label
                htmlFor="replace-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Replace entire analyzer (enables full editing)
              </label>
              <div className="mt-2">
                {replaceMode ? (
                  <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Replace Mode Active</p>
                      <p className="text-amber-700">
                        This will completely replace the existing analyzer configuration.
                        All fields will be editable and the entire analyzer will be recreated.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Update Mode Active</p>
                      <p className="text-blue-700">
                        Only the analyzer description can be updated due to Azure AI API limitations.
                        All other fields are read-only.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyzer Selection */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="bg-card/50">
          <CardTitle className="text-foreground">Select Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Choose Analyzer to Update *
            </label>
            <ReactSelect
              isLoading={loadingAnalyzers}
              value={selectedAnalyzerId ? {
                value: selectedAnalyzerId,
                label: availableAnalyzers.find(a => a.analyzerId === selectedAnalyzerId)?.displayName || selectedAnalyzerId
              } : null}
              onChange={(option) => setSelectedAnalyzerId(option?.value || "")}
              options={availableAnalyzers.map(analyzer => ({
                value: analyzer.analyzerId,
                label: analyzer.displayName || analyzer.analyzerId,
                analyzer
              }))}
              formatOptionLabel={(option) => (
                <div className="flex flex-col py-1">
                  <span className="font-medium text-sm">
                    {option.label}
                  </span>
                  <span className="text-xs text-blue-600 font-mono">
                    ID: {option.value}
                  </span>
                  {option.analyzer?.description && (
                    <span className="text-xs text-gray-500 mt-1">
                      {option.analyzer.description}
                    </span>
                  )}
                </div>
              )}
              placeholder="Type to search analyzers..."
              isSearchable
              className="w-full"
              classNamePrefix="react-select"
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '48px',
                  borderRadius: '6px'
                }),
                option: (provided) => ({
                  ...provided,
                  padding: '8px 12px'
                })
              }}
            />
          </div>
        </CardContent>
      </Card>

      {selectedAnalyzerId && (
        <>
          {loadingAnalyzerDetails && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="py-8">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading analyzer details...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {!loadingAnalyzerDetails && (
            <form onSubmit={handleSubmit(
              onSubmit,
              () => {
                // console.log("UpdateAnalyzer validation errors:", errors);
                toast.error("Please fix validation errors before submitting");
              }
            )} className="space-y-6">
              {/* Basic Information */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="bg-card/50">
                  <CardTitle className="text-foreground">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Analyzer ID
                    </label>
                    <Input
                      type="text"
                      value={selectedAnalyzerId}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Analyzer ID cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Display Name
                    </label>
                    <Controller
                      name="displayName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="text"
                          disabled={!replaceMode}
                          className={!replaceMode ? "bg-gray-50" : ""}
                          placeholder="Human-readable name for the analyzer"
                        />
                      )}
                    />
                    {!replaceMode && (
                      <p className="text-xs text-gray-500 mt-1">
                        Display name cannot be changed in update mode
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Description
                    </label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          placeholder="Describe what this analyzer does..."
                          rows={3}
                        />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Field Configuration */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="bg-card/50">
                  <CardTitle className="text-foreground">
                    Field Configuration {!replaceMode && "(Read-Only)"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {replaceMode
                      ? "Configure the analyzer's field schema. These fields will define what data the analyzer extracts."
                      : "Field schema cannot be modified in update mode. Only description can be updated."
                    }
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                          Field {index + 1} {!replaceMode && "(Read-Only)"}
                        </h4>
                        {replaceMode && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeField(index)}
                            disabled={fields.length === 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className={`grid grid-cols-1 gap-3 ${field.type === 'Table' || field.type === 'Fixed Table' ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            Field Name *
                          </label>
                          <Input
                            type="text"
                            value={field.name || ""}
                            onChange={(e) => updateField(index, "name", e.target.value)}
                            disabled={!replaceMode}
                            className={!replaceMode ? "bg-gray-50" : ""}
                            placeholder="e.g., CertificateNumber"
                            required={replaceMode}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            Field Description
                          </label>
                          <Input
                            type="text"
                            value={field.description || ""}
                            onChange={(e) => updateField(index, "description", e.target.value)}
                            disabled={!replaceMode}
                            className={!replaceMode ? "bg-gray-50" : ""}
                            placeholder="e.g., Unique identifier for the BASIX certificate"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            Value Type
                          </label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateField(index, "type", value)}
                            disabled={!replaceMode}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {primitiveTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {field.type !== 'Table' && field.type !== 'Fixed Table' && (
                          <div>
                            <label className="text-xs font-medium mb-1 block">
                              Method
                              <span className="text-xs text-gray-500 ml-1">
                                (Available: {getAllowedMethods(field.type).join(', ')})
                              </span>
                            </label>
                            <Select
                              value={field.method || "Extract"}
                              onValueChange={(value) => updateField(index, "method", value)}
                              disabled={!replaceMode}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAllowedMethods(field.type).map((method) => (
                                  <SelectItem key={method} value={method}>
                                    {method}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {field.type !== 'String' && (
                              <p className="text-xs text-amber-600 mt-1">
                                Note: {field.type} fields cannot use Classify
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Enum Values for Classify Method */}
                      {field.method === 'Classify' && replaceMode && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Classification Options</label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentField = fields[index];
                                const updatedField = { ...currentField };
                                if (!updatedField.enum) {
                                  updatedField.enum = [];
                                }
                                updatedField.enum.push('');
                                update(index, updatedField);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Option
                            </Button>
                          </div>

                          {field.enum?.map((enumValue, enumIndex) => (
                            <div key={enumIndex} className="flex gap-2 items-center mb-2">
                              <Controller
                                name={`fields.${index}.enum.${enumIndex}`}
                                control={control}
                                render={({ field: enumField }) => (
                                  <Input
                                    {...enumField}
                                    placeholder={`Option ${enumIndex + 1}`}
                                    className="flex-1"
                                  />
                                )}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentField = fields[index];
                                  const updatedField = { ...currentField };
                                  if (updatedField.enum && updatedField.enum.length > 1) {
                                    updatedField.enum.splice(enumIndex, 1);
                                    update(index, updatedField);
                                  }
                                }}
                                disabled={!field.enum || field.enum.length <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}

                          {(!field.enum || field.enum.length === 0) && (
                            <p className="text-sm text-gray-500 italic">No classification options defined. Add at least one option for Classify method.</p>
                          )}
                        </div>
                      )}

                      {/* Object/Table Properties */}
                      {(field.type === 'object' || field.type === 'Table' || field.type === 'Fixed Table') && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium">
                              {field.type === 'Table' || field.type === 'Fixed Table' ? 'Table Columns' : 'Object Properties'} {!replaceMode && "(Read-Only)"}
                            </h5>
                          </div>

                          <PropertyFieldArray
                            control={control}
                            fieldIndex={index}
                            fieldType={field.type === 'Table' || field.type === 'Fixed Table' ? 'Table' : 'Object'}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {replaceMode ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addField}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Field configuration is read-only in update mode. Only the analyzer description can be updated.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadAnalyzerDetails(selectedAnalyzerId)}
                >
                  Reset Changes
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? (replaceMode ? "Replacing..." : "Updating...")
                    : (replaceMode ? "Replace Analyzer" : "Update Analyzer")
                  }
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}