import { AppShell } from "@/components/app-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark">
      <AppShell>{children}</AppShell>
    </div>
  );
}