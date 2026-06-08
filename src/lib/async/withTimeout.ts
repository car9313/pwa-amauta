export const LOGIN_TIMEOUT_MESSAGE =
  "La conexión está muy lenta. ¿Lo intentamos de nuevo?";

export const REGISTER_TIMEOUT_MESSAGE =
  "La conexión está muy lenta. ¿Lo intentamos de nuevo?";

export class TimeoutError extends Error {
  readonly isTimeout = true;

  constructor(
    message: string = "La operación tardó demasiado. Inténtalo de nuevo."
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage?: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new TimeoutError(timeoutMessage)),
      ms
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
