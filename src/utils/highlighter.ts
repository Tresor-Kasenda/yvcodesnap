import { codeToHtml, codeToTokens, type BundledTheme, type BundledLanguage } from 'shiki';
import { CODE_THEMES, type CodeThemeId } from '../types';

let highlighterReady = false;

function normalizeThemeId(theme: unknown): CodeThemeId {
    if (typeof theme !== 'string') return 'dracula';
    const found = CODE_THEMES.some((t) => t.id === theme);
    return (found ? theme : 'dracula') as CodeThemeId;
}

export async function highlightCode(
    code: string,
    language: string,
    theme: CodeThemeId
): Promise<string> {
    try {
        const safeTheme = normalizeThemeId(theme);
        const html = codeToHtml(code, {
            lang: language as BundledLanguage,
            theme: safeTheme as BundledTheme,
        });
        highlighterReady = true;
        return html;
    } catch (error) {
        console.error('Highlighting error:', error);
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
}

export interface TokenInfo {
    content: string;
    color: string;
}

export interface LineTokens {
    tokens: TokenInfo[];
}

export async function tokenizeCode(
    code: string,
    language: string,
    theme: CodeThemeId
): Promise<LineTokens[]> {
    try {
        const safeTheme = normalizeThemeId(theme);
        const result = await codeToTokens(code, {
            lang: language as BundledLanguage,
            theme: safeTheme as BundledTheme,
        });
        highlighterReady = true;
        return result.tokens.map(line => ({
            tokens: line.map(token => ({
                content: token.content,
                color: token.color || '#ffffff',
            })),
        }));
    } catch (error) {
        console.error('Tokenization error:', error);
        // Fallback: return plain text tokens
        return code.split('\n').map(line => ({
            tokens: [{ content: line, color: '#ffffff' }],
        }));
    }
}

export function getThemeBackground(themeId: string): string {
    const theme = CODE_THEMES.find(t => t.id === themeId);
    return theme?.bg || '#1e1e2e';
}

export function isLightTheme(themeId: string): boolean {
    const lightThemes = ['github-light', 'vitesse-light', 'min-light', 'solarized-light', 'light-plus'];
    return lightThemes.includes(themeId);
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function isHighlighterReady(): boolean {
    return highlighterReady;
}

// Language detection based on common patterns
export function detectLanguage(code: string): string {
    // Kotlin / Jetpack Compose patterns (check first - primary language)
    // Look for @Composable, fun, val, var, class, object, companion object, etc.
    if (/@Composable|@Preview|@OptIn|@Suppress/.test(code)) {
        return 'kotlin';
    }
    if (/^(fun|val|var|class|object|package|import|sealed|data\s+class|enum\s+class|interface)\s+/m.test(code)) {
        // Check for Kotlin-specific syntax
        if (/:\s*\w+(\s*[={()]|$|\s*,)/.test(code) ||
            /\b(Unit|String|Int|Long|Boolean|Float|Double|List|Map|Set|suspend|inline|crossinline|noinline|reified)\b/.test(code) ||
            /\bModifier\b|\bColumn\b|\bRow\b|\bBox\b|\bText\b|\bButton\b|\bScaffold\b/.test(code) ||
            /\.copy\(|\.let\s*\{|\.apply\s*\{|\.also\s*\{|\.run\s*\{/.test(code) ||
            /\blambda\b|->/.test(code)) {
            return 'kotlin';
        }
    }

    // TypeScript/JavaScript patterns
    if (/^import\s+.*from\s+['"]|^export\s+(default\s+)?|const\s+\w+:\s*\w+/m.test(code)) {
        if (/:\s*(string|number|boolean|any|void|Promise|Array)\b/.test(code)) {
            return 'typescript';
        }
        return 'javascript';
    }

    // Java patterns (after Kotlin to avoid false positives)
    if (/^(public|private|protected)\s+(static\s+)?(class|void|int|String)/m.test(code) &&
        !/@Composable/.test(code)) {
        return 'java';
    }

    // Swift patterns
    if (/^(func|var|let|class|struct|enum|protocol|import\s+\w+)\s+/m.test(code) &&
        /@State|@Binding|@Published|@ObservedObject|some\s+View/.test(code)) {
        return 'swift';
    }

    // Dart/Flutter patterns
    if (/^(class|void|final|const|import\s+')/m.test(code) &&
        /Widget|StatelessWidget|StatefulWidget|BuildContext|setState/.test(code)) {
        return 'dart';
    }

    // Python patterns
    if (/^(def|class|import|from|if __name__|print\()/m.test(code) && !/[{};]/.test(code)) {
        return 'python';
    }

    // Rust patterns
    if (/^(fn|let|mut|impl|struct|enum|use|pub)\s+/m.test(code) && /->/.test(code)) {
        return 'rust';
    }

    // Go patterns
    if (/^(func|package|import|type|var|const)\s+/m.test(code) && /:=/.test(code)) {
        return 'go';
    }

    // Groovy/Gradle patterns
    if (/^(plugins|dependencies|android|buildscript)\s*\{/m.test(code) ||
        /implementation\s*\(|compile\s*\(/.test(code)) {
        return 'groovy';
    }

    // XML patterns (for Android layouts)
    if (/^<\?xml|^<resources|^<layout|^<LinearLayout|^<RelativeLayout|^<ConstraintLayout|^<androidx\./m.test(code)) {
        return 'xml';
    }

    // HTML patterns
    if (/^<!DOCTYPE|<html|<head|<body|<div/m.test(code)) {
        return 'html';
    }

    // CSS patterns
    if (/^[.#\w\-[\]]+\s*\{[^}]*\}/m.test(code)) {
        return 'css';
    }

    // JSON patterns
    if (/^\s*[{[]/.test(code) && /[}\]]\s*$/.test(code)) {
        try {
            JSON.parse(code);
            return 'json';
        } catch {
            // Not valid JSON, continue checking
        }
    }

    // YAML patterns
    if (/^[\w-]+:\s*(\n|$)|^\s+-\s+/m.test(code) && !/[{};]/.test(code)) {
        return 'yaml';
    }

    // SQL patterns
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+/im.test(code)) {
        return 'sql';
    }

    // Bash/Shell patterns
    if (/^#!\/bin\/(bash|sh)|^\$\s+|^echo\s+|^export\s+/m.test(code)) {
        return 'bash';
    }

    // PHP patterns
    if (
        /^<\?php|<\?=/m.test(code) ||
        (/\$[A-Za-z_]\w*/.test(code) && /(->|::)/.test(code) && /(function|class)\s+\w+/.test(code)) ||
        /\bnamespace\s+[\w\\]+;/.test(code) ||
        /\buse\s+[\w\\]+;/.test(code)
    ) {
        return 'php';
    }

    return 'kotlin'; // Default to Kotlin as primary language
}
