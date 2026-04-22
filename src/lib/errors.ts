type ErrorLike = {
  code?: string;
  message?: string;
};

export function logDevError(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
}

export function friendlyDataError(error: unknown): string {
  const code = (error as ErrorLike | undefined)?.code ?? "";

  if (code.includes("permission-denied")) {
    return "Você não tem permissão para acessar ou alterar estes dados.";
  }
  if (code.includes("unauthenticated")) {
    return "Sua sessão expirou. Entre novamente.";
  }
  if (code.includes("unavailable") || code.includes("network")) {
    return "Não foi possível conectar. Verifique sua internet e tente novamente.";
  }
  if (code.includes("failed-precondition")) {
    return "Não foi possível concluir a operação. Recarregue a página e tente novamente.";
  }

  return "Tente novamente em instantes.";
}

export function permissionError(message: string): Error {
  const error = new Error(message) as Error & { code: string };
  error.code = "permission-denied";
  return error;
}
