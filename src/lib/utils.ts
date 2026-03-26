// Utility function for conditional classNames (Tailwind/React)
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const localStorageKey = ()=>{
  return localStorage.getItem("token") || "";
}