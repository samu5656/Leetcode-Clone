import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  rectangularSelection,
  crosshairCursor,
  placeholder as cmPlaceholder,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  searchKeymap,
  highlightSelectionMatches,
} from "@codemirror/search";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { rust } from "@codemirror/lang-rust";
import { oneDark } from "@codemirror/theme-one-dark";

const languageExtensions = {
  javascript: () => javascript(),
  python: () => python(),
  "c++": () => cpp(),
  c: () => cpp(),
  go: () => javascript(), // Go mode: similar enough syntax highlighting
  java: () => java(),
  rust: () => rust(),
  dart: () => javascript(), // Dart mode: JS highlighting as fallback
};

// Custom theme overrides that match the app's design tokens.
const customTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "var(--bg-header-start)",
  },
  ".cm-content": {
    fontFamily:
      "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    caretColor: "#f97316",
    padding: "12px 0",
  },
  ".cm-cursor": {
    borderLeftColor: "#f97316",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "rgba(249, 115, 22, 0.2) !important",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--bg-header-start)",
    color: "var(--text-sub)",
    borderRight: "1px solid var(--border-line)",
    minWidth: "44px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "var(--text-main)",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    border: "1px solid rgba(249, 115, 22, 0.3)",
    color: "#f97316",
  },
  ".cm-matchingBracket": {
    backgroundColor: "rgba(249, 115, 22, 0.3) !important",
    outline: "1px solid rgba(249, 115, 22, 0.5)",
  },
});

/**
 * CodeMirror 6 React wrapper.
 *
 * Props:
 *  - value: string — current document contents
 *  - onChange: (newValue: string) => void — called on every edit
 *  - language: string — one of the supported language keys
 *  - placeholder: string — placeholder text when editor is empty
 */
export default function CodeEditor({
  value,
  onChange,
  language = "python",
  placeholder = "",
}) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);

  // Keep callback ref fresh without recreating the editor.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create / recreate editor when language changes.
  useEffect(() => {
    if (!containerRef.current) return;

    const langExt = languageExtensions[language];

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      oneDark,
      customTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorState.tabSize.of(4),
      EditorView.lineWrapping,
    ];

    if (langExt) extensions.push(langExt());
    if (placeholder) extensions.push(cmPlaceholder(placeholder));

    const state = EditorState.create({
      doc: value || "",
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Sync external value changes (e.g. reset code).
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== undefined && value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value || "" },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      style={{ minHeight: "200px" }}
    />
  );
}
