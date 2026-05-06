import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ANALYSIS_MODELS', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses fallback defaults when no env vars set', async () => {
    delete process.env.MODEL_RUN_ANALYSIS;
    delete process.env.MODEL_RUN_ANALYSIS_LIGHT;
    delete process.env.MODEL_SESSION_COMPARISON;
    delete process.env.MODEL_EXTRACT_FEATURES;
    delete process.env.MODEL_ASSESS_FEATURES;

    const { ANALYSIS_MODELS } = await import('../models');
    expect(ANALYSIS_MODELS.RUN_ANALYSIS_FULL).toContain('sonnet');
    expect(ANALYSIS_MODELS.RUN_ANALYSIS_LIGHT).toContain('haiku');
    expect(ANALYSIS_MODELS.SESSION_COMPARISON).toContain('haiku');
    expect(ANALYSIS_MODELS.EXTRACT_FEATURES).toContain('haiku');
    expect(ANALYSIS_MODELS.ASSESS_FEATURES).toContain('haiku');
  });

  it('respects env var overrides', async () => {
    process.env.MODEL_RUN_ANALYSIS = 'custom-sonnet-id';
    process.env.MODEL_RUN_ANALYSIS_LIGHT = 'custom-haiku-id';

    const { ANALYSIS_MODELS } = await import('../models');
    expect(ANALYSIS_MODELS.RUN_ANALYSIS_FULL).toBe('custom-sonnet-id');
    expect(ANALYSIS_MODELS.RUN_ANALYSIS_LIGHT).toBe('custom-haiku-id');
  });
});
