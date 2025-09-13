import { describe, it, expect } from "@jest/globals"
import { generateApiKey, hashApiKey, compareApiKey, generateTraceId } from "@/lib/integration-auth"

describe("Integration Auth Utils", () => {
  it("should generate valid API keys", () => {
    const apiKey = generateApiKey()
    expect(apiKey).toHaveLength(64) // 32 bytes = 64 hex chars
    expect(/^[a-f0-9]+$/.test(apiKey)).toBe(true)
  })

  it("should hash and compare API keys correctly", async () => {
    const apiKey = "test-api-key-123"
    const hash = await hashApiKey(apiKey)

    expect(hash).not.toBe(apiKey)
    expect(hash.startsWith("$2a$12$")).toBe(true)

    const isValid = await compareApiKey(apiKey, hash)
    expect(isValid).toBe(true)

    const isInvalid = await compareApiKey("wrong-key", hash)
    expect(isInvalid).toBe(false)
  })

  it("should generate unique trace IDs", () => {
    const traceId1 = generateTraceId()
    const traceId2 = generateTraceId()

    expect(traceId1).toHaveLength(32)
    expect(traceId2).toHaveLength(32)
    expect(traceId1).not.toBe(traceId2)
    expect(/^[a-f0-9]+$/.test(traceId1)).toBe(true)
  })
})
