type AuthFeedbackProps = {
  type: 'error' | 'success';
  message: string;
};

export function AuthFeedback({ type, message }: AuthFeedbackProps) {
  const styles =
    type === 'error'
      ? 'text-red-700 dark:text-red-300 bg-red-50/90 dark:bg-red-950/35 border-red-200 dark:border-red-900/50'
      : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-900/50';

  return <p className={`text-sm rounded-xl px-3 py-2 border ${styles}`}>{message}</p>;
}
