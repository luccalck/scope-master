import { useState, useEffect } from "react";
import { UserCheck, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { fetchUsuariosPendentes, autorizarUsuario } from "../lib/api";
import { Usuario } from "../lib/types";

export function AutorizarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUsuariosPendentes();
      setUsuarios(data);
    } catch (error) {
      console.error("Erro ao buscar usuários pendentes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutorizar = async (id: string, nomeOriginal: string, perfil: 'Administrador' | 'Desenvolvedor' | 'Cliente') => {
    try {
      setIsProcessing(id);
      const novoNome = nomeOriginal.replace("[PENDENTE] ", "");
      await autorizarUsuario(id, novoNome, perfil);
      
      // Remove da lista
      setUsuarios(usuarios.filter(u => u.id_usuario !== id));
      alert(`Usuário ${novoNome} autorizado como ${perfil}.`);
    } catch (error) {
      console.error("Erro ao autorizar usuário:", error);
      alert("Erro ao autorizar o usuário.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-foreground flex-shrink-0" />
          Autorizar Usuários
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os novos cadastros e defina seus cargos no sistema.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-6 sm:p-12 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Nenhum usuário pendente</h3>
          <p className="text-muted-foreground mt-1">Todos os cadastros já foram avaliados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {usuarios.map((usuario) => {
            const nomeLimpo = usuario.nome.replace("[PENDENTE] ", "");
            return (
              <div key={usuario.id_usuario} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-semibold text-lg text-foreground truncate">{nomeLimpo}</h3>
                  <p className="text-sm text-muted-foreground truncate">{usuario.email}</p>
                </div>
                <div className="p-5 bg-muted/50 flex flex-col gap-3">
                  <p className="text-sm font-medium text-foreground">Selecione o cargo:</p>
                  
                  <Button 
                    className="w-full bg-foreground hover:bg-foreground/90 text-background"
                    disabled={isProcessing === usuario.id_usuario}
                    onClick={() => handleAutorizar(usuario.id_usuario, usuario.nome, "Administrador")}
                  >
                    {isProcessing === usuario.id_usuario ? "Processando..." : "Administrador"}
                  </Button>
                  
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isProcessing === usuario.id_usuario}
                    onClick={() => handleAutorizar(usuario.id_usuario, usuario.nome, "Desenvolvedor")}
                  >
                    {isProcessing === usuario.id_usuario ? "Processando..." : "Desenvolvedor"}
                  </Button>
                  
                  <Button 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    disabled={isProcessing === usuario.id_usuario}
                    onClick={() => handleAutorizar(usuario.id_usuario, usuario.nome, "Cliente")}
                  >
                    {isProcessing === usuario.id_usuario ? "Processando..." : "Cliente"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
