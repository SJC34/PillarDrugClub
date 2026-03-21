import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  DollarSign,
  BarChart3,
  HeartPulse,
  Headphones,
  Users,
  Mail,
  FileBarChart,
  Upload,
  Gift,
  PenTool,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { title: "Executive Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Financial", url: "/admin/financial", icon: DollarSign },
  { title: "Marketing", url: "/admin/marketing", icon: BarChart3 },
  { title: "Fulfillment", url: "/admin/fulfillment", icon: HeartPulse },
  { title: "Customer Service", url: "/admin/cs", icon: Headphones },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Communications", url: "/admin/communications", icon: Mail },
  { title: "Reports", url: "/admin/reports", icon: FileBarChart },
  { title: "Medication Pricing", url: "/admin/pricing", icon: Upload },
  { title: "Referrals", url: "/admin/referrals", icon: Gift },
  { title: "Blog Manager", url: "/admin/blog", icon: PenTool },
  { title: "Rx Management", url: "/admin-portal", icon: Shield },
];

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3.5rem",
} as React.CSSProperties;

function AdminSidebar() {
  const [location] = useLocation();

  const isActive = (url: string) => {
    if (url === "/admin") return location === "/admin" || location === "/admin/dashboard";
    return location === url;
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm text-foreground">PDC Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={isActive(item.url)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-full w-full min-h-screen">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 px-4 py-2 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-admin-sidebar-toggle" />
            <span className="text-sm text-muted-foreground">Pillar Drug Club — Admin</span>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
