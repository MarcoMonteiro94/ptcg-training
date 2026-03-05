"use client";

import { memo } from "react";

/**
 * Lightweight markdown renderer for coach chat messages.
 * Handles: bold, italic, code, code blocks, lists, headers, links.
 * No external dependency needed — uses regex-based parsing.
 */
function MarkdownMessageInner({ content }: { content: string }) {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

export const MarkdownMessage = memo(MarkdownMessageInner);

// --- Block-level parsing ---

interface TextBlock { type: "paragraph"; content: string }
interface HeadingBlock { type: "heading"; level: number; content: string }
interface CodeBlock { type: "code"; language: string; content: string }
interface ListBlock { type: "list"; ordered: boolean; items: string[] }
interface HrBlock { type: "hr" }

type ParsedBlock = TextBlock | HeadingBlock | CodeBlock | ListBlock | HrBlock;

function parseBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", language, content: codeLines.join("\n") });
      i++; // skip closing ```
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, content: headingMatch[2] });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*[-*+]\s/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*\d+\.\s/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty lines)
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("```") && !lines[i].match(/^#{1,4}\s/) && !/^[\s]*[-*+]\s/.test(lines[i]) && !/^[\s]*\d+\.\s/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", content: paraLines.join("\n") });
    }
  }

  return blocks;
}

function Block({ block }: { block: ParsedBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <div className={block.level <= 2 ? "font-semibold text-foreground" : "font-medium text-foreground/90"}>
          <InlineContent text={block.content} />
        </div>
      );
    case "code":
      return (
        <pre className="rounded-lg bg-muted/40 border border-border/30 p-3 text-xs font-mono overflow-x-auto">
          <code>{block.content}</code>
        </pre>
      );
    case "list":
      if (block.ordered) {
        return (
          <ol className="space-y-1 pl-5 list-decimal marker:text-muted-foreground/60 marker:text-xs">
            {block.items.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed pl-1">
                <InlineContent text={item} />
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="space-y-1 pl-5 list-disc marker:text-muted-foreground/60 marker:text-xs">
          {block.items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed pl-1">
              <InlineContent text={item} />
            </li>
          ))}
        </ul>
      );
    case "hr":
      return <hr className="border-border/30 my-2" />;
    case "paragraph":
      return (
        <p>
          <InlineContent text={block.content} />
        </p>
      );
  }
}

// --- Inline parsing ---

function InlineContent({ text }: { text: string }) {
  const parts = parseInline(text);
  return <>{parts.map((part, i) => <InlinePart key={i} part={part} />)}</>;
}

interface InlineText { type: "text"; content: string }
interface InlineBold { type: "bold"; content: string }
interface InlineItalic { type: "italic"; content: string }
interface InlineCode { type: "code"; content: string }
interface InlineLink { type: "link"; text: string; href: string }

type InlinePart = InlineText | InlineBold | InlineItalic | InlineCode | InlineLink;

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  // Match: **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      parts.push({ type: "bold", content: match[2] });
    } else if (match[3]) {
      parts.push({ type: "italic", content: match[4] });
    } else if (match[5]) {
      parts.push({ type: "code", content: match[6] });
    } else if (match[7]) {
      parts.push({ type: "link", text: match[8], href: match[9] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length === 0 ? [{ type: "text", content: text }] : parts;
}

function InlinePart({ part }: { part: InlinePart }) {
  switch (part.type) {
    case "bold":
      return <strong className="font-semibold text-foreground">{part.content}</strong>;
    case "italic":
      return <em className="italic text-foreground/80">{part.content}</em>;
    case "code":
      return <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono text-primary/90">{part.content}</code>;
    case "link":
      return <span className="text-primary underline underline-offset-2">{part.text}</span>;
    case "text":
      return <>{part.content}</>;
  }
}
