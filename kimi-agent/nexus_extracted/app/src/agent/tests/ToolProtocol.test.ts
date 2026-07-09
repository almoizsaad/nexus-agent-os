import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../tools/ToolRegistry';
import type { AdvancedTool } from '../tools/protocols/ToolSchema';

class AdvancedMockTool implements AdvancedTool {
  name = 'adv_tool';
  description = 'desc';
  inputSchema = { type: 'object', required: ['id'] };
  outputSchema = {};
  async execute(_input: any) { return { ok: true }; }
}

describe('ToolProtocol', () => {
  it('should validate input against schema', () => {
    const registry = new ToolRegistry();
    registry.register(new AdvancedMockTool());
    
    expect(registry.validateInput('adv_tool', { id: 1 })).toBe(true);
    expect(registry.validateInput('adv_tool', { wrong: 1 })).toBe(false);
  });
});
