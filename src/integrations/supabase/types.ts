export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      loans: {
        Row: {
          amortization_start_date: string
          created_at: string
          date_granted: string
          department: string
          employee_name: string
          id: string
          interest: number
          is_reloan: boolean | null
          loan_term_months: number
          loan_type: string
          monthly_amortization: number
          next_payment_date: string | null
          payment_schedule_generated: boolean | null
          previous_loan_id: string | null
          principal_amount: number
          remaining_balance: number
          remaining_months: number
          status: string | null
          total_loan: number
          updated_at: string
        }
        Insert: {
          amortization_start_date: string
          created_at?: string
          date_granted: string
          department: string
          employee_name: string
          id?: string
          interest: number
          is_reloan?: boolean | null
          loan_term_months: number
          loan_type: string
          monthly_amortization: number
          next_payment_date?: string | null
          payment_schedule_generated?: boolean | null
          previous_loan_id?: string | null
          principal_amount: number
          remaining_balance: number
          remaining_months: number
          status?: string | null
          total_loan: number
          updated_at?: string
        }
        Update: {
          amortization_start_date?: string
          created_at?: string
          date_granted?: string
          department?: string
          employee_name?: string
          id?: string
          interest?: number
          is_reloan?: boolean | null
          loan_term_months?: number
          loan_type?: string
          monthly_amortization?: number
          next_payment_date?: string | null
          payment_schedule_generated?: boolean | null
          previous_loan_id?: string | null
          principal_amount?: number
          remaining_balance?: number
          remaining_months?: number
          status?: string | null
          total_loan?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_previous_loan_id_fkey"
            columns: ["previous_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          is_auto_marked: boolean | null
          loan_id: string
          payment_date: string
          payment_type: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          is_auto_marked?: boolean | null
          loan_id: string
          payment_date: string
          payment_type?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          is_auto_marked?: boolean | null
          loan_id?: string
          payment_date?: string
          payment_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
