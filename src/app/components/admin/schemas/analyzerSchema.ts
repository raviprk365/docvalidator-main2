import { z } from "zod";

const primitiveTypes = [
  "String",
  "Date",
  "Time",
  "Number",
  "Integer",
  "Boolean",
  "Table",
  "Fixed Table",
] as const;

const methods = ["Extract", "Generate", "Classify"] as const;

// Schema for individual property within objects/tables
const propertySchema = z.object({
  type: z.enum(primitiveTypes),
  method: z.enum(methods),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
});

// Schema for properties as an array for form handling
const propertyFormSchema = z.object({
  name: z.string().min(1, "Property name is required"),
  type: z.enum(["String", "Date", "Time", "Number", "Integer", "Boolean"]),
  method: z.enum(methods),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
});

// Schema for array items
const arrayItemSchema = z.object({
  type: z.enum(primitiveTypes),
  method: z.enum(methods),
  properties: z.record(propertySchema).optional(),
});

// Main field schema
const fieldSchema = z
  .object({
    name: z.string().min(1, "Field name is required"),
    type: z.enum(primitiveTypes),
    method: z.string().optional(), // Can be empty for Table/Fixed Table
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    properties: z.array(propertyFormSchema).optional(), // Changed to array for form handling
    items: arrayItemSchema.optional(),
  })
  .refine(
    (field) => {
      // Table and Fixed Table types shouldn't have methods
      if (field.type === "Table" || field.type === "Fixed Table") {
        return !field.method || field.method === "";
      }

      const methodsList = ["Extract", "Generate", "Classify"];
      return (
        field.method &&
        field.method.trim() !== "" &&
        methodsList.includes(field.method)
      );
    },
    {
      message:
        "Table and Fixed Table types should not have methods. Other types require a valid method.",
      path: ["method"],
    }
  )
  .refine(
    (field) => {
      // Classify method requires enum values
      if (field.method === "Classify") {
        return (
          field.enum &&
          field.enum.length > 0 &&
          field.enum.some((e) => e.trim() !== "")
        );
      }
      return true;
    },
    {
      message: "Classify method requires at least one enum value",
      path: ["enum"],
    }
  );

// Main analyzer schema
export const analyzerSchema = z
  .object({
    analyzerId: z.string().min(1, "Analyzer ID is required"),
    displayName: z.string().optional(),
    description: z.string().optional(),
    baseAnalyzerId: z.string().default("prebuilt-documentAnalyzer"),
    fields: z.array(fieldSchema).min(1, "At least one field is required"),
  })
  .refine(
    (data) => {
      // Check for unique field names
      const fieldNames = data.fields.map((f) => f.name.toLowerCase());
      return new Set(fieldNames).size === fieldNames.length;
    },
    {
      message: "Field names must be unique",
      path: ["fields"],
    }
  );

export type AnalyzerFormData = z.infer<typeof analyzerSchema>;
export type FieldFormData = z.infer<typeof fieldSchema>;
export type PropertyFormData = z.infer<typeof propertyFormSchema>;

// Method validation rules for UI
export const methodValidationRules = {
  String: ["Extract", "Generate", "Classify"],
  Date: ["Extract", "Generate"],
  Time: ["Extract", "Generate"],
  Number: ["Extract", "Generate"],
  Integer: ["Extract", "Generate"],
  Boolean: ["Extract", "Generate"],
  Table: [],
  "Fixed Table": [],
} as const;

export const getAllowedMethods = (fieldType: string): string[] => {
  return (
    methodValidationRules[fieldType as keyof typeof methodValidationRules] || [
      "Extract",
    ]
  );
};

export { methods, primitiveTypes };
