// Regras de senha forte:
// - 8 a 12 caracteres
// - Pelo menos 1 maiúscula
// - Pelo menos 1 minúscula
// - Pelo menos 1 número
// - Pelo menos 1 caractere especial

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\S]{8,12}$/;

export function isStrongPassword(password: string): boolean {
  return STRONG_PASSWORD_REGEX.test(password);
}

export function getPasswordStrengthError(password: string): string | null {
  if (password.length < 8 || password.length > 12) {
    return "A senha deve ter entre 8 e 12 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "A senha deve conter pelo menos 1 letra maiúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "A senha deve conter pelo menos 1 letra minúscula.";
  }
  if (!/\d/.test(password)) {
    return "A senha deve conter pelo menos 1 número.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "A senha deve conter pelo menos 1 caractere especial.";
  }
  if (/\s/.test(password)) {
    return "A senha não pode conter espaços.";
  }
  return null;
}

