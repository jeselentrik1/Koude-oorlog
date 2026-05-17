import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Quote, Eraser } from 'lucide-react';

/**
 * Minimal contentEditable-based rich text editor.
 *
 * We deliberately use `document.execCommand` despite its deprecation: it's
 * good-enough for short speaker notes, requires zero deps, and Chromium / Webkit
 * still support it. The output is plain HTML stored as-is.
 *
 * Caveats:
 *  - The component owns the DOM via `contentEditable`, so we sync from `value`
 *    only when the *external* value changes (avoid clobbering caret on every
 *    keystroke).
 */
export default function RichTextEditor({ value, onChange, placeholder = 'Spreker notities...' }) {
  const editorRef = useRef(null);
  const lastExternalValue = useRef(value);

  useEffect(() => {
    if (!editorRef.current) return;
    if (value === lastExternalValue.current) return;
    if (editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value || '';
    lastExternalValue.current = value;
  }, [value]);

  const exec = (cmd, arg) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || '';
    lastExternalValue.current = html;
    onChange?.(html);
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'b') { e.preventDefault(); exec('bold'); }
      else if (e.key.toLowerCase() === 'i') { e.preventDefault(); exec('italic'); }
      else if (e.key.toLowerCase() === 'u') { e.preventDefault(); exec('underline'); }
    }
  };

  return (
    <div className="flex flex-col gap-2 min-h-0 flex-1" data-no-slide>
      <div className="flex flex-wrap gap-1 p-2 bg-white/5 border border-white/10 rounded-xl">
        <ToolbarBtn onClick={() => exec('bold')} title="Vet (Ctrl+B)"><Bold className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} title="Cursief (Ctrl+I)"><Italic className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('underline')} title="Onderstrepen (Ctrl+U)"><Underline className="w-4 h-4" /></ToolbarBtn>
        <Sep />
        <ToolbarBtn onClick={() => exec('formatBlock', 'H2')} title="Kop 1"><Heading1 className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'H3')} title="Kop 2"><Heading2 className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'BLOCKQUOTE')} title="Citaat"><Quote className="w-4 h-4" /></ToolbarBtn>
        <Sep />
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Lijst"><List className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Genummerde lijst"><ListOrdered className="w-4 h-4" /></ToolbarBtn>
        <Sep />
        <ToolbarBtn onClick={() => exec('removeFormat')} title="Opmaak wissen"><Eraser className="w-4 h-4" /></ToolbarBtn>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="rte-editor flex-1 min-h-[180px] bg-black/30 border border-white/10 rounded-xl p-4 outline-none focus:border-white/30 transition-colors text-base leading-relaxed text-white/90 overflow-y-auto"
      />
    </div>
  );
}

function ToolbarBtn({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px self-stretch bg-white/10 mx-1" />;
}
