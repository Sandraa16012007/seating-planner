export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Shape of the Supabase schema. Keep this in sync with
 * `supabase/migrations/*_initial_schema.sql`.
 */
export type Database = {
  public: {
    Tables: {
      seating_tables: {
        Row: {
          capacity: number;
          table_number: number;
        };
        Insert: {
          capacity: number;
          table_number: number;
        };
        Update: {
          capacity?: number;
          table_number?: number;
        };
        Relationships: [];
      };
      students: {
        Row: {
          class_section: string;
          created_at: string;
          id: string;
          name: string;
          name_normalized: string;
          table_number: number;
        };
        Insert: {
          class_section: string;
          created_at?: string;
          id?: string;
          name: string;
          table_number: number;
        };
        Update: {
          class_section?: string;
          created_at?: string;
          id?: string;
          name?: string;
          table_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "students_table_number_fkey";
            columns: ["table_number"];
            isOneToOne: false;
            referencedRelation: "seating_tables";
            referencedColumns: ["table_number"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      add_student: {
        Args: {
          p_class_section: string;
          p_name: string;
          p_table_number: number;
        };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      remove_student: {
        Args: {
          p_student_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
