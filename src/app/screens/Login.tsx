import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import bcrypt from "bcryptjs";
import { fetchUsuarioPorEmail, criarUsuarioPendente, atualizarUsuario } from "../lib/api";

export function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || (isRegistering && !nome)) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    if (!email.includes("@")) {
      setError("Por favor, insira um e-mail válido");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        const usuarioExistente = await fetchUsuarioPorEmail(email);
        if (usuarioExistente) {
          setError("Este e-mail já está em uso.");
          setIsLoading(false);
          return;
        }

        await criarUsuarioPendente(nome, email, password);
        setSuccess("Cadastro realizado! Esperando autorização do Administrador.");
        setIsRegistering(false);
        setNome("");
        setPassword("");
      } else {
        const usuario = await fetchUsuarioPorEmail(email);

        const isBcrypt = usuario?.senha_hash?.startsWith('$2');
        const senhaCorreta = usuario && (
          isBcrypt
            ? await bcrypt.compare(password, usuario.senha_hash)
            : password === usuario.senha_hash
        );

        if (!senhaCorreta) {
          setError("Usuário ou senha incorretas.");
          setIsLoading(false);
          return;
        }

        if (!isBcrypt) {
          const novoHash = await bcrypt.hash(password, 10);
          await atualizarUsuario(usuario.id_usuario, { senha_hash: novoHash });
        }

        if (usuario.nome.startsWith("[PENDENTE] ")) {
          setError("Esperando autorização do Administrador.");
          setIsLoading(false);
          return;
        }

        localStorage.setItem("scopemaster_authenticated", "true");
        localStorage.setItem(
          "scopemaster_user",
          JSON.stringify({
            id: usuario.id_usuario,
            name: usuario.nome,
            email: usuario.email,
            role: usuario.perfil,
          })
        );
        navigate("/");
      }
    } catch (err) {
      console.error("Erro ao processar:", err);
      setError("Erro ao conectar ao servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background sutil — gradiente radial e grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_50%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Marca */}
        <div className="flex flex-col items-center mb-10">
          <div className="mb-5 flex items-center justify-center w-12 h-12 rounded-md border border-border bg-card/50 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-foreground" />
          </div>
          <h1 className="text-3xl tracking-tight font-light text-foreground">
            Scope<span className="font-medium">Master</span>
          </h1>
          <div className="mt-3 h-px w-12 bg-border" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-3">
            Gerenciamento de Requisitos
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/40 backdrop-blur-md text-card-foreground rounded-md border border-border/60 p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/5 border border-destructive/30 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-foreground/5 border border-foreground/20 rounded-md p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{success}</p>
              </div>
            )}

            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs uppercase tracking-wider text-muted-foreground font-normal">
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full h-11 bg-transparent border-border/70 focus-visible:ring-1 focus-visible:ring-foreground/30 focus-visible:border-foreground/40"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-normal">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-transparent border-border/70 focus-visible:ring-1 focus-visible:ring-foreground/30 focus-visible:border-foreground/40"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-normal">
                  Senha
                </Label>
                {!isRegistering && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() =>
                      alert(
                        "Funcionalidade de recuperação de senha não implementada neste protótipo"
                      )
                    }
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-transparent border-border/70 focus-visible:ring-1 focus-visible:ring-foreground/30 focus-visible:border-foreground/40"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-foreground hover:bg-foreground/90 text-background font-medium tracking-wide transition-all"
              disabled={isLoading}
            >
              {isLoading
                ? (isRegistering ? "Cadastrando..." : "Entrando...")
                : (isRegistering ? "Cadastrar" : "Entrar")}
            </Button>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card/40 px-3 text-xs text-muted-foreground uppercase tracking-wider">
                  ou
                </span>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError("");
                  setSuccess("");
                }}
              >
                {isRegistering
                  ? "Já tem uma conta? Faça login"
                  : "Não tem uma conta? Cadastre-se"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground/60 tracking-wider">
          <p>© 2026 ScopeMaster</p>
        </div>
      </div>
    </div>
  );
}
