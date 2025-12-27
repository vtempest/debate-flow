"use client";

import { useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  ChevronDown,
  Minus,
  ListTodo,
  Check,
  Loader2,
  AlertCircle,
  Save,
  Type,
  Download,
  FileText,
  FileType,
  FileCode,
  RotateCcw,
  Upload,
  Link2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Columns,
  Rows,
  Highlighter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorState, type Editor } from "@tiptap/react";

interface MarkdownToolbarProps {
  editor: Editor;
  saveState?: "idle" | "saving" | "saved" | "error";
  onSave?: () => void;
  onDiscard?: () => void; // Called when user discards changes
  fileName?: string;
  hideActions?: boolean; // Hide Export/Save (when they're in parent header)
  isBubbleMenu?: boolean; // Used in BubbleMenu context
  isFloatingMenu?: boolean; // Used in FloatingMenu context
  hasChanges?: boolean; // Whether there are unsaved changes
  sandboxId?: string; // Sandbox ID for uploading images
}

export function MarkdownToolbar({
  editor,
  saveState = "idle",
  onSave,
  onDiscard,
  fileName = "document",
  hideActions = false,
  isBubbleMenu = false,
  isFloatingMenu = false,
  hasChanges = false,
  sandboxId,
}: MarkdownToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Tiptap's proper state hooks for reactive state management
  const canUndo = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.can().undo();
    },
  });

  const canRedo = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.can().redo();
    },
  });

  const isBold = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("bold");
    },
  });

  const isItalic = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("italic");
    },
  });

  const isUnderline = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("underline");
    },
  });

  const isStrike = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("strike");
    },
  });

  const isCode = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("code");
    },
  });

  const isBulletList = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("bulletList");
    },
  });

  const isOrderedList = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("orderedList");
    },
  });

  const isTaskList = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("taskList");
    },
  });

  const isBlockquote = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("blockquote");
    },
  });

  const isCodeBlock = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("codeBlock");
    },
  });

  const isLink = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("link");
    },
  });

  const isInTable = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("table");
    },
  });

  const isHighlight = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return false;
      return editor.isActive("highlight");
    },
  });

  const currentHeading = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return "Normal";
      if (editor.isActive("heading", { level: 1 })) return "Heading 1";
      if (editor.isActive("heading", { level: 2 })) return "Heading 2";
      if (editor.isActive("heading", { level: 3 })) return "Heading 3";
      return "Normal";
    },
  });

  const wordCount = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return 0;
      return editor.storage.characterCount?.words() || 0;
    },
  });

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!editor) return;

      setIsExporting(true);
      try {
        const content = editor.getHTML();

      } catch (error) {
        console.error("Export error:", error);
      } finally {
        setIsExporting(false);
      }
    },
    [editor, fileName],
  );

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    icon: Icon,
    tooltip,
    shortcut,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    icon: React.ElementType;
    tooltip: string;
    shortcut?: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          disabled={disabled}
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0",
            isActive && "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{tooltip}</span>
        {shortcut && (
          <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded font-mono">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );

  const insertLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const openImageDialog = useCallback(() => {
    setImageUrl("");
    setImagePreview(null);
    setSelectedFile(null);
    setIsImageDialogOpen(true);
  }, []);

  const handleImageFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        // Store the file for upload
        setSelectedFile(file);
        setImageUrl(""); // Clear URL when file is selected

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setImagePreview(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    },
    [],
  );


  const insertTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  // Table control functions
  const addRowBefore = useCallback(() => {
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  const SaveButton = () => {
    if (!onSave) return null;

    switch (saveState) {
      case "saving":
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="gap-1.5 h-8 px-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Saving</span>
          </Button>
        );
      case "saved":
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="gap-1.5 h-8 px-2 text-green-600"
          >
            <Check className="h-4 w-4" />
            <span className="text-xs">Saved</span>
          </Button>
        );
      case "error":
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className="gap-1.5 h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">Retry</span>
          </Button>
        );
      default:
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={!hasChanges}
                className="gap-1.5 h-8 px-2"
              >
                <Save className="h-4 w-4" />
                <span className="text-xs">Save</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {hasChanges ? (
                <>
                  Save changes{" "}
                  <kbd className="ml-1.5 px-1 py-0.5 text-[10px] bg-muted rounded font-mono">
                    ⌘S
                  </kbd>
                </>
              ) : (
                "No changes to save"
              )}
            </TooltipContent>
          </Tooltip>
        );
    }
  };

  const toolbarContent = (
    <>
      {/* Auto-save status indicator - Left side, only in main toolbar */}
      {!isBubbleMenu && !isFloatingMenu && (
        <>
          <div className="flex items-center gap-1 shrink-0">
            {saveState === "saving" && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="font-medium">Saving...</span>
              </div>
            )}
            {saveState === "saved" && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md">
                <Check className="h-3 w-3" />
                <span className="font-medium">Saved</span>
              </div>
            )}
            {saveState === "error" && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-500 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md">
                <AlertCircle className="h-3 w-3" />
                <span className="font-medium">Error</span>
              </div>
            )}
            {saveState === "idle" && hasChanges && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-medium">Unsaved</span>
              </div>
            )}
          </div>
          {(saveState !== "idle" || hasChanges) && (
            <Separator orientation="vertical" className="h-6 mx-1 shrink-0" />
          )}
        </>
      )}

      {/* Undo/Redo - only show in main toolbar */}
      {!isBubbleMenu && !isFloatingMenu && (
        <>
          <div className="flex items-center shrink-0">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!canUndo}
              icon={Undo}
              tooltip="Undo"
              shortcut="⌘Z"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!canRedo}
              icon={Redo}
              tooltip="Redo"
              shortcut="⌘⇧Z"
            />
          </div>
          <Separator orientation="vertical" className="h-6 mx-1 shrink-0" />
        </>
      )}

      {/* Text Style - only show in main toolbar and floating menu */}
      {!isBubbleMenu && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-8 px-2 min-w-[70px] justify-between shrink-0"
              >
                <span className="text-xs truncate">{currentHeading}</span>
                <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
              >
                <Type className="mr-2 h-4 w-4" />
                Normal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                <Heading1 className="mr-2 h-4 w-4" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                <Heading2 className="mr-2 h-4 w-4" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
              >
                <Heading3 className="mr-2 h-4 w-4" />
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="h-6 mx-1 shrink-0" />
        </>
      )}

      {/* Text formatting */}
      <div className="flex items-center shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={isBold}
          icon={Bold}
          tooltip="Bold"
          shortcut="⌘B"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={isItalic}
          icon={Italic}
          tooltip="Italic"
          shortcut="⌘I"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={isUnderline}
          icon={UnderlineIcon}
          tooltip="Underline"
          shortcut="⌘U"
        />
        {!isBubbleMenu && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={isStrike}
              icon={Strikethrough}
              tooltip="Strikethrough"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={isCode}
              icon={Code}
              tooltip="Inline Code"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={isHighlight}
              icon={Highlighter}
              tooltip="Highlight"
            />
          </>
        )}
      </div>

      {/* Lists - only show in main toolbar and floating menu */}
      {!isBubbleMenu && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1 shrink-0" />
          <div className="flex items-center shrink-0">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={isBulletList}
              icon={List}
              tooltip="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={isOrderedList}
              icon={ListOrdered}
              tooltip="Numbered List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={isTaskList}
              icon={ListTodo}
              tooltip="Task List"
            />
          </div>
        </>
      )}

      {/* Blocks - only show in main toolbar and floating menu */}
      {!isBubbleMenu && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1 shrink-0" />
          <div className="flex items-center shrink-0">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={isBlockquote}
              icon={Quote}
              tooltip="Quote"
            />

          </div>
        </>
      )}

      {/* Insert - only show in main toolbar and floating menu */}
      {!isBubbleMenu && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1 shrink-0" />
          <div className="flex items-center shrink-0">
            <ToolbarButton
              onClick={insertLink}
              isActive={isLink}
              icon={LinkIcon}
              tooltip="Link"
              shortcut="⌘K"
            />

          </div>
        </>
      )}

      {/* Table Controls - show when cursor is in a table */}
      {!isBubbleMenu && !isFloatingMenu && isInTable && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1 shrink-0" />
          <div className="flex items-center gap-0.5 shrink-0 bg-muted/50 rounded-md px-1 py-0.5">
            <span className="text-[10px] text-muted-foreground font-medium px-1">
              Table
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-1.5 gap-1">
                  <Rows className="h-3.5 w-3.5" />
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={addRowBefore}>
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Add row above
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addRowAfter}>
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Add row below
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={deleteRow}
                  className="text-destructive focus:text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete row
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-1.5 gap-1">
                  <Columns className="h-3.5 w-3.5" />
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={addColumnBefore}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Add column left
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addColumnAfter}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Add column right
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={deleteColumn}
                  className="text-destructive focus:text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteTable}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Delete table</TooltipContent>
            </Tooltip>
          </div>
        </>
      )}

      {/* Word count & Export - Right side, only in main toolbar */}
      {!isBubbleMenu && !isFloatingMenu && (
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="hidden md:inline text-xs text-muted-foreground tabular-nums">
            {wordCount} words
          </span>

          {!hideActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <FileType className="h-4 w-4 text-muted-foreground" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")}>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Word
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("html")}>
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("markdown")}>
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </>
  );

  // Image Dialog
  const imageDialog = (
    <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="upload"
              className="gap-1.5 opacity-50 cursor-not-allowed"
              disabled
            >
              <Upload className="h-4 w-4" />
              Upload
              <span className="text-[10px] ml-1">(Soon)</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1.5">
              <Link2 className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-4 pt-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                "hover:border-primary hover:bg-muted/50",
                imagePreview && "border-primary bg-muted/50",
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileSelect}
              />
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded-lg object-contain"
                  />
                  <p className="text-sm text-muted-foreground">
                    Click to change image
                  </p>
                  {sandboxId && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Will be uploaded to workspace
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 50MB
                  </p>
                  {sandboxId && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Image will be uploaded to workspace
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="url" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(null); // Clear preview when URL is entered
                }}
              />
            </div>
            {imageUrl && (
              <div className="border rounded-lg p-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsImageDialogOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // For bubble/floating menus, return just the content without wrapper
  if (isBubbleMenu || isFloatingMenu) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">{toolbarContent}</div>
      </TooltipProvider>
    );
  }

  // Main toolbar with full wrapper
  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="px-2 py-1.5 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {toolbarContent}
        </div>
      </div>
      {imageDialog}
    </TooltipProvider>
  );
}
