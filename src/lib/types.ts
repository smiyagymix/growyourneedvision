// Minimal Result utility used by pocketbase wrapper
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T, E>(value: T): Result<T, E> => ({ ok: true, value });
export const Err = <T, E>(error: E): Result<T, E> => ({ ok: false, error });

export type Option<T> =
  | { hasValue: true; value: T }
  | { hasValue: false };

export const Some = <T>(value: T): Option<T> => ({ hasValue: true, value });
export const None = <T>(): Option<T> => ({ hasValue: false });
