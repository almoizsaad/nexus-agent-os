import type { DocumentFormat, KnowledgeMetadata, KnowledgeSourceType } from '../types/knowledge';

export interface LoadedDocument {
  content: string;
  metadata: Partial<KnowledgeMetadata>;
}

export class DocumentLoader {
  public async load(source: string, type: KnowledgeSourceType, format: DocumentFormat, content?: string): Promise<LoadedDocument> {
    // If content is provided directly (e.g. from a file upload in UI)
    if (content) {
      return {
        content: this.processContent(content, format),
        metadata: {
          source,
          sourceType: type,
          format,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [],
          importance: 0.5
        }
      };
    }

    // In a real implementation, we would fetch/read from source
    // For now, we'll assume content is passed or it's a mock read
    return {
      content: `Content from ${source}`,
      metadata: {
        source,
        sourceType: type,
        format,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        importance: 0.5
      }
    };
  }

  private processContent(content: string, format: DocumentFormat): string {
    switch (format) {
      case 'json':
        try {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        } catch (e) {
          return content;
        }
      case 'markdown':
      case 'txt':
      case 'pdf': // Handled as text abstraction for now
      default:
        return content;
    }
  }
}
