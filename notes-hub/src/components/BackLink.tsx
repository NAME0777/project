interface BackLinkProps {
  label: string;
  onClick: () => void;
}

export default function BackLink({ label, onClick }: BackLinkProps) {
  return (
    <button onClick={onClick} className="text-sm text-pen hover:underline">
      ← {label}
    </button>
  );
}
