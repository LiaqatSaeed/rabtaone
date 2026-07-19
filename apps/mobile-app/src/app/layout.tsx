import "./globals.css";
import { RoleProvider } from "@/lib/role-context";
import { BottomNav } from "@/components/BottomNav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RoleProvider>
          <div className="pb-20">{children}</div>
          <BottomNav />
        </RoleProvider>
      </body>
    </html>
  );
}
