import { describe, it, expect, vi } from "vitest";
import { withTimeout, TimeoutError, LOGIN_TIMEOUT_MESSAGE, REGISTER_TIMEOUT_MESSAGE } from "./withTimeout";

describe("withTimeout", () => {
  it("resolves when the promise resolves before the timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("ok"), 10);
    });
    await expect(withTimeout(promise, 200)).resolves.toBe("ok");
  });

  it("rejects with TimeoutError when the promise does not resolve in time", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late"), 200);
    });
    await expect(
      withTimeout(promise, 20, "Custom timeout message")
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it("uses the provided custom message in the rejection", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late"), 200);
    });
    await expect(
      withTimeout(promise, 20, "Muy lento, intenta otra vez")
    ).rejects.toMatchObject({
      message: "Muy lento, intenta otra vez",
      isTimeout: true,
    });
  });

  it("uses default message when none provided", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late"), 200);
    });
    await expect(withTimeout(promise, 20)).rejects.toMatchObject({
      name: "TimeoutError",
      message: expect.any(String),
    });
  });

  it("clears the timer when the promise resolves first", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const promise = Promise.resolve("ok");
    await withTimeout(promise, 5_000);
    expect(clearSpy).toHaveBeenCalled();
  });

  it("propagates the original error when the promise rejects before timeout", async () => {
    const failing = Promise.reject(new Error("original failure"));
    await expect(withTimeout(failing, 200)).rejects.toThrow("original failure");
  });
});

describe("TimeoutError", () => {
  it("is named TimeoutError", () => {
    const err = new TimeoutError();
    expect(err.name).toBe("TimeoutError");
  });

  it("has isTimeout flag set to true", () => {
    const err = new TimeoutError();
    expect(err.isTimeout).toBe(true);
  });

  it("accepts a custom message", () => {
    const err = new TimeoutError("custom");
    expect(err.message).toBe("custom");
  });
});

describe("timeout message constants", () => {
  it("LOGIN_TIMEOUT_MESSAGE is in Spanish", () => {
    expect(LOGIN_TIMEOUT_MESSAGE).toMatch(/[a-záéíóúñ]/i);
  });

  it("REGISTER_TIMEOUT_MESSAGE is in Spanish", () => {
    expect(REGISTER_TIMEOUT_MESSAGE).toMatch(/[a-záéíóúñ]/i);
  });
});
