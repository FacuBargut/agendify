import BottomNav from "@/components/layout/BottomNav";

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <>
      <main className="flex-1 pb-safe">{children}</main>
      <BottomNav />
    </>
  );
}
