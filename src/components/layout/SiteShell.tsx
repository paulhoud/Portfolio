import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <>
      <Sidebar />
      <MobileNav />
      <main className="portfolio-main">{children}</main>
    </>
  );
}
