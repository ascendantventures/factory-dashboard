// Type definitions for .pen file format (Pencil.dev)

export interface PenFile {
  version: string;
  canvas: {
    width: number;
    height: number;
    frames: PenFrame[];
    variables?: PenVariable[];
  };
}

export interface PenFrame {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elements: PenElement[];
}

export interface PenElement {
  id: string;
  type: 'rectangle' | 'text' | 'image' | 'group' | 'ellipse' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;       // CSS color or variable reference e.g. "{color.primary}"
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number;
  // Text elements only:
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  // Group elements only:
  children?: PenElement[];
}

export interface PenVariable {
  name: string;
  type: 'color' | 'typography' | 'spacing' | 'number';
  value: string | number;
  // Typography variables:
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
}

// Parsed summary returned by /api/designs/parse
export interface PenFileSummary {
  frameCount: number;
  frames: Array<{ id: string; name: string; width: number; height: number }>;
  tokens: {
    colors: Array<{ name: string; value: string }>;
    typography: Array<{ name: string; fontFamily: string; fontSize: number; fontWeight: number }>;
    spacing: Array<{ name: string; value: number }>;
  };
  canvas: { width: number; height: number };
}

// Database row types
export interface PencilDesignRow {
  id: string;
  repo_id: string;
  issue_number: number;
  file_url: string;
  commit_sha: string | null;
  version: number;
  source: 'pipeline' | 'user';
  created_at: string;
  updated_at: string;
  attachment?: {
    id: string;
    file_name: string;
    file_size: number | null;
    storage_path: string;
  };
}

export interface PencilDesignAttachmentRow {
  id: string;
  repo_id: string;
  issue_number: number;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}
