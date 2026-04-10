export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          login_method: string;
          credits: number;
          total_credits: number;
          used_this_month: number;
          encrypted_api_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          email: string;
          avatar_url?: string | null;
          login_method?: string;
          credits?: number;
          total_credits?: number;
          used_this_month?: number;
          encrypted_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          avatar_url?: string | null;
          credits?: number;
          total_credits?: number;
          used_this_month?: number;
          encrypted_api_key?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          agent_status: 'connected' | 'disconnected';
          agent_last_seen: string | null;
          agent_path: string | null;
          agent_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          agent_status?: 'connected' | 'disconnected';
          agent_last_seen?: string | null;
          agent_path?: string | null;
          agent_token?: string | null;
        };
        Update: {
          name?: string;
          agent_status?: 'connected' | 'disconnected';
          agent_last_seen?: string | null;
          agent_path?: string | null;
          agent_token?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          project_id: string;
          number: number;
          title: string;
          summary: string | null;
          raw_log: string | null;
          files_changed: number;
          changed_files: Json;
          prompts: Json;
          external_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          number?: number;
          title?: string;
          summary?: string | null;
          raw_log?: string | null;
          files_changed?: number;
          changed_files?: Json;
          prompts?: Json;
          external_session_id?: string | null;
        };
        Update: {
          title?: string;
          summary?: string | null;
          raw_log?: string | null;
          files_changed?: number;
          changed_files?: Json;
          prompts?: Json;
          external_session_id?: string | null;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          project_id: string;
          session_id: string | null;
          title: string;
          level: 'critical' | 'warning' | 'info';
          status: 'unconfirmed' | 'confirmed' | 'resolved';
          fact: string;
          detail: string;
          fix_command: string;
          file: string;
          basis: string;
          is_redetected: boolean;
          detected_at: string;
          confirmed_at: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          session_id?: string | null;
          title: string;
          level: 'critical' | 'warning' | 'info';
          status?: 'unconfirmed' | 'confirmed' | 'resolved';
          fact?: string;
          detail?: string;
          fix_command?: string;
          file?: string;
          basis?: string;
          is_redetected?: boolean;
          detected_at?: string;
          confirmed_at?: string | null;
          resolved_at?: string | null;
        };
        Update: {
          title?: string;
          level?: 'critical' | 'warning' | 'info';
          status?: 'unconfirmed' | 'confirmed' | 'resolved';
          fact?: string;
          detail?: string;
          fix_command?: string;
          file?: string;
          basis?: string;
          is_redetected?: boolean;
          confirmed_at?: string | null;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      guidelines: {
        Row: {
          id: string;
          project_id: string;
          source_issue_id: string | null;
          title: string;
          rule: string;
          status: 'unapplied' | 'applied';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_issue_id?: string | null;
          title: string;
          rule: string;
          status?: 'unapplied' | 'applied';
        };
        Update: {
          title?: string;
          rule?: string;
          status?: 'unapplied' | 'applied';
          source_issue_id?: string | null;
        };
        Relationships: [];
      };
      spec_documents: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          type: 'FRD' | 'PRD';
          file_url: string | null;
          uploaded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          type: 'FRD' | 'PRD';
          file_url?: string | null;
          uploaded_at?: string;
        };
        Update: {
          name?: string;
          type?: 'FRD' | 'PRD';
          file_url?: string | null;
        };
        Relationships: [];
      };
      spec_features: {
        Row: {
          id: string;
          project_id: string;
          document_id: string | null;
          name: string;
          source: 'FRD' | 'PRD';
          status: 'implemented' | 'partial' | 'unimplemented' | 'attention';
          implemented_items: Json;
          total_items: number;
          related_files: Json;
          prd_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          document_id?: string | null;
          name: string;
          source: 'FRD' | 'PRD';
          status?: 'implemented' | 'partial' | 'unimplemented' | 'attention';
          implemented_items?: Json;
          total_items?: number;
          related_files?: Json;
          prd_summary?: string | null;
        };
        Update: {
          name?: string;
          source?: 'FRD' | 'PRD';
          status?: 'implemented' | 'partial' | 'unimplemented' | 'attention';
          implemented_items?: Json;
          total_items?: number;
          related_files?: Json;
          prd_summary?: string | null;
        };
        Relationships: [];
      };
      ephemeral_data: {
        Row: {
          id: string;
          session_id: string;
          data_type: 'file_tree' | 'diff';
          content: Json;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          data_type: 'file_tree' | 'diff';
          content: Json;
          expires_at?: string;
        };
        Update: {
          data_type?: 'file_tree' | 'diff';
          content?: Json;
          expires_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
