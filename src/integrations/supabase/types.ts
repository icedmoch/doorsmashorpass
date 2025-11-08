export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      food_items: {
        Row: {
          calories: number
          created_at: string | null
          date: string | null
          dietary_fiber: number
          id: number
          location: string | null
          meal_type: string | null
          name: string
          protein: number
          serving_size: string
          sodium: number
          sugars: number
          total_carb: number
          total_fat: number
        }
        Insert: {
          calories: number
          created_at?: string | null
          date?: string | null
          dietary_fiber: number
          id?: number
          location?: string | null
          meal_type?: string | null
          name: string
          protein: number
          serving_size: string
          sodium: number
          sugars: number
          total_carb: number
          total_fat: number
        }
        Update: {
          calories?: number
          created_at?: string | null
          date?: string | null
          dietary_fiber?: number
          id?: number
          location?: string | null
          meal_type?: string | null
          name?: string
          protein?: number
          serving_size?: string
          sodium?: number
          sugars?: number
          total_carb?: number
          total_fat?: number
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          created_at: string | null
          entry_date: string
          food_item_id: number
          id: number
          meal_category: string
          servings: number | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          entry_date: string
          food_item_id: number
          id?: number
          meal_category: string
          servings?: number | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          food_item_id?: number
          id?: number
          meal_category?: string
          servings?: number | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          food_item_name: string
          id: number
          order_id: number
          protein: number
          quantity: number
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          food_item_name: string
          id?: never
          order_id: number
          protein?: number
          quantity?: number
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          food_item_name?: string
          id?: never
          order_id?: number
          protein?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          claimed_at: string | null
          created_at: string
          delivery_location: string | null
          delivery_option: string
          delivery_person_id: number | null
          delivery_time: string
          id: number
          special_notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          user_id: number
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          delivery_location?: string | null
          delivery_option: string
          delivery_person_id?: number | null
          delivery_time: string
          id?: never
          special_notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          user_id: number
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          delivery_location?: string | null
          delivery_option?: string
          delivery_person_id?: number | null
          delivery_time?: string
          id?: never
          special_notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_person_id_fkey"
            columns: ["delivery_person_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activity_level: string
          age: number
          bmr: number | null
          created_at: string | null
          height_cm: number
          id: number
          sex: string
          tdee: number | null
          username: string
          weight_kg: number
        }
        Insert: {
          activity_level: string
          age: number
          bmr?: number | null
          created_at?: string | null
          height_cm: number
          id?: number
          sex: string
          tdee?: number | null
          username: string
          weight_kg: number
        }
        Update: {
          activity_level?: string
          age?: number
          bmr?: number | null
          created_at?: string | null
          height_cm?: number
          id?: number
          sex?: string
          tdee?: number | null
          username?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: [
        "pending",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
