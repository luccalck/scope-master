import { useState } from "react";
import { CreditCard, CheckCircle2, Shield, Zap, Star } from "lucide-react";
import { Button } from "../components/ui/button";

const PLANOS = [
  {
    id: "basico",
    nome: "Básico",
    preco: "R$ 49,90",
    periodo: "/mês",
    cor: "bg-foreground",
    icone: <Shield className="w-6 h-6 text-foreground" />,
    destaque: false,
    recursos: [
      "Até 3 projetos simultâneos",
      "Suporte por e-mail",
      "Acesso aos relatórios básicos",
      "1 usuário administrador",
    ],
  },
  {
    id: "pro",
    nome: "Profissional",
    preco: "R$ 99,90",
    periodo: "/mês",
    cor: "bg-indigo-600",
    icone: <Zap className="w-6 h-6 text-indigo-600" />,
    destaque: true,
    recursos: [
      "Projetos ilimitados",
      "Suporte prioritário 24/7",
      "Relatórios avançados e exportação",
      "Até 5 usuários administradores",
      "Personalização de marca",
    ],
  },
  {
    id: "enterprise",
    nome: "Empresarial",
    preco: "R$ 249,90",
    periodo: "/mês",
    cor: "bg-slate-800",
    icone: <Star className="w-6 h-6 text-slate-800" />,
    destaque: false,
    recursos: [
      "Tudo do plano Profissional",
      "Servidor dedicado",
      "Gerente de conta exclusivo",
      "Usuários ilimitados",
      "API de integração",
      "Treinamento presencial",
    ],
  },
];

export function Pagamentos() {
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null);

  const handleAssinar = (id: string) => {
    setPlanoSelecionado(id);
    setTimeout(() => {
      alert("Redirecionando para o ambiente seguro do Mercado Pago...");
      setPlanoSelecionado(null);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-h-screen bg-background text-foreground">
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-foreground/10 rounded-full mb-4">
          <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Escolha o plano ideal para você
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Evolua a gestão de requisitos dos seus projetos. Pague com segurança usando nossa integração Mercado Pago.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
        {PLANOS.map((plano) => (
          <div
            key={plano.id}
            className={`relative flex flex-col bg-card rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl ${
              plano.destaque ? "border-2 border-indigo-600 md:scale-105 z-10" : "border border-border mt-4 md:mt-0"
            }`}
          >
            {plano.destaque && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Mais Popular
                </span>
              </div>
            )}

            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-muted`}>{plano.icone}</div>
                <h3 className="text-xl font-bold text-card-foreground">{plano.nome}</h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-card-foreground">{plano.preco}</span>
                <span className="text-muted-foreground font-medium">{plano.periodo}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plano.recursos.map((recurso, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plano.destaque ? "text-indigo-600" : "text-green-500"}`} />
                    <span>{recurso}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 pt-0 mt-auto">
              <Button
                onClick={() => handleAssinar(plano.id)}
                disabled={planoSelecionado !== null}
                className={`w-full py-6 text-lg font-semibold rounded-xl ${
                  plano.destaque
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {planoSelecionado === plano.id ? "Processando..." : "Assinar agora"}
              </Button>
            </div>
            
            {/* Logo do Mercado Pago na base */}
            <div className="absolute bottom-[-40px] left-0 right-0 flex justify-center opacity-50">
               <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                 Pague via Mercado Pago
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
