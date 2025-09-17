"use client";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Control, Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { analyzerSchema, getAllowedMethods, methods, primitiveTypes, type AnalyzerFormData } from './schemas/analyzerSchema';



interface PropertyFieldArrayProps {
  control: Control<AnalyzerFormData>;
  fieldIndex: number;
  fieldType: string;
}

interface EnumFieldArrayProps {
  control: Control<AnalyzerFormData>;
  fieldIndex: number;
}

function EnumFieldArray({ control, fieldIndex }: EnumFieldArrayProps) {
  const { fields: enumValues, append: appendEnum, remove: removeEnum } = useFieldArray({
    control,
    name: `fields.${fieldIndex}.enum`
  });

  const addEnumValue = () => {
    appendEnum("");
  };

  const removeEnumValue = (enumIndex: number) => {
    if (enumValues.length > 1) {
      removeEnum(enumIndex);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium">Classification Options (Required for Classify Method)</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEnumValue}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Option
        </Button>
      </div>

      {enumValues.map((enumValue, enumIndex) => (
        <div key={enumValue.id} className="flex gap-2 items-center">
          <Controller
            name={`fields.${fieldIndex}.enum.${enumIndex}`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={`Option ${enumIndex + 1}`}
                className="flex-1"
              />
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeEnumValue(enumIndex)}
            disabled={enumValues.length === 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
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

export default function CreateAnalyzer() {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<AnalyzerFormData>({
    resolver: zodResolver(analyzerSchema),
    defaultValues: {
      analyzerId: "",
      displayName: "",
      description: "",
      baseAnalyzerId: "prebuilt-documentAnalyzer",
      fields: [
        { name: "", type: "String", method: "Extract", description: "", properties: [], enum: [""] }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields"
  });

  const addField = () => {
    append({ name: "", type: "string", method: "Extract", description: "", properties: [], enum: [""] });
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: AnalyzerFormData) => {
    setLoading(true);

    try {
      // Filter out empty fields and ensure they have valid names
      const validFields = data.fields.filter(field =>
        field.name &&
        field.name.trim() &&
        field.type
      );

      // Build field schema for API
      const fieldSchema = {
        fields: validFields.reduce((acc, field) => {
          // Map UI types to Azure API types
          const typeMapping: Record<string, string> = {
            'String': 'string',
            'Boolean': 'boolean',
            'Integer': 'integer',
            'Number': 'number',
            'Date': 'date',
            'Time': 'string', // Time maps to string in Azure
            'Table': 'table',
            'Fixed Table': 'fixedTable'
          };

          const fieldDef: Record<string, unknown> = {
            type: typeMapping[field.type] || field.type.toLowerCase(),
            description: field.description || ""
          };

          // Add method for non-table types
          if (field.type !== 'Table' && field.type !== 'Fixed Table' && field.method) {
            // Map UI methods to Azure API methods (lowercase)
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

      const analyzerData = {
        analyzerId: data.analyzerId,
        displayName: data.displayName?.trim() || data.analyzerId,
        description: data.description?.trim(),
        fieldSchema,
        baseAnalyzerId: data.baseAnalyzerId,
        config: {
          returnDetails: true
        }
      };

      // console.log("Sending analyzer data:", JSON.stringify(analyzerData, null, 2));

      const response = await fetch(`/api/analyzers/${data.analyzerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analyzerData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create analyzer: ${response.status} - ${errorData}`);
      }

      toast.success("Analyzer created successfully!");
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset form
      reset();

    } catch (err) {
      console.error("Error creating analyzer:", err);
      toast.error(err instanceof Error ? err.message : "Error while submitting. Please check your input and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Create New Analyzer</h2>
        <p className="text-muted-foreground">Define a new analyzer with custom fields and processing methods.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Basic Information */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="bg-card/50">
            <CardTitle className="text-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Analyzer ID *
              </label>
              <Controller
                name="analyzerId"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., my-custom-analyzer"
                    className={errors.analyzerId ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.analyzerId && (
                <p className="text-xs text-red-500 mt-1">{errors.analyzerId.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for the analyzer (lowercase, no spaces)
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
                    placeholder="Human-readable name for the analyzer"
                  />
                )}
              />
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
            <CardTitle className="text-foreground">Field Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const fieldType = watch(`fields.${index}.type`);
              const fieldMethod = watch(`fields.${index}.method`);

              return (
                <div key={field.id} className="p-4 border border-border rounded-lg space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Field {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeField(index)}
                      disabled={fields.length === 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className={`grid grid-cols-1 gap-3 ${fieldType === 'Table' || fieldType === 'Fixed Table' ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Field Name *
                      </label>
                      <Controller
                        name={`fields.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="e.g., CertificateNumber"
                            className={errors.fields?.[index]?.name ? "border-red-500" : ""}
                          />
                        )}
                      />
                      {errors.fields?.[index]?.name && (
                        <p className="text-xs text-red-500 mt-1">{errors.fields[index]?.name?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Field Description
                      </label>
                      <Controller
                        name={`fields.${index}.description`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="e.g., Unique identifier for the BASIX certificate"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block">
                        Value Type
                      </label>
                      <Controller
                        name={`fields.${index}.type`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear method for Table/Fixed Table types
                              if (value === 'Table' || value === 'Fixed Table') {
                                setValue(`fields.${index}.method`, '');
                              }
                            }}
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
                        )}
                      />
                    </div>

                    {fieldType !== 'Table' && fieldType !== 'Fixed Table' && (
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          Method
                          <span className="text-xs text-gray-500 ml-1">
                            (Available: {getAllowedMethods(fieldType).join(', ')})
                          </span>
                        </label>
                        <Controller
                          name={`fields.${index}.method`}
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAllowedMethods(fieldType).map((method) => (
                                  <SelectItem key={method} value={method}>
                                    {method}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {fieldType !== 'String' && (
                          <p className="text-xs text-amber-600 mt-1">
                            Note: {fieldType} fields cannot use Classify
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enum values for classify method */}
                  {fieldMethod === 'Classify' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <EnumFieldArray
                        control={control}
                        fieldIndex={index}
                      />
                    </div>
                  )}

                  {/* Table Properties */}
                  {(fieldType === 'Table' || fieldType === 'Fixed Table') && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <PropertyFieldArray
                        control={control}
                        fieldIndex={index}
                        fieldType={fieldType}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={addField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
          >
            Reset
          </Button>
          <Button type="submit" disabled={loading || isSubmitting}>
            {loading || isSubmitting ? "Creating..." : "Create Analyzer"}
          </Button>
        </div>
      </form>
    </div>
  );
}