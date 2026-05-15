import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  BarChart3,
  Settings,
  HelpCircle,
  UserCheck,
  CreditCard,
  X,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("scopemaster_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) {}
    }
  }, []);

  const navigation = [
    { name: "Painel de Propostas", href: "/", icon: LayoutDashboard },
    { name: "Fluxo de Ideias", href: "/requirements", icon: FileText },
    { name: "Projetos Aprovados", href: "/projects", icon: FolderKanban },
    { name: "Métricas de Aprovação", href: "/analytics", icon: BarChart3 },
  ];

  if (userRole === "Administrador") {
    navigation.push({ name: "Autorizar Usuários", href: "/autorizar-usuarios", icon: UserCheck });
  }

  if (userRole === "Cliente") {
    navigation.push({ name: "Planos e Pagamentos", href: "/pagamentos", icon: CreditCard });
  }

  const secondaryNavigation = [
    { name: "Configurações", href: "/settings", icon: Settings },
    { name: "Ajuda", href: "/help", icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop — só aparece em mobile quando aberto */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — em md+ fica fixa no fluxo; em < md é drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-sidebar border-r border-border
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo e botão fechar (mobile) */}
        <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-6 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-sidebar-foreground truncate">
              ScopeMaster
            </span>
          </div>
          {/* Botão fechar visível só em mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                  ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="border-t border-border px-3 py-4 space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                  ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
