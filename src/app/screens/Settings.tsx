import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Type, User, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import bcrypt from "bcryptjs";
import { fetchUsuarioPorId, atualizarUsuario } from "../lib/api";

export function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Settings App
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState("16");

  // Perfil
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  // Senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  useEffect(() => {
    // Carregar configurações locais
    const savedFont = localStorage.getItem("scopemaster_font_family") || "Inter";
    const savedSize = localStorage.getItem("scopemaster_font_size") || "16";
    setFontFamily(savedFont);
    setFontSize(savedSize);

    // Carregar usuário logado
    const userDataString = localStorage.getItem("scopemaster_user");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserId(userData.id);
      
      // Buscar dados atualizados
      fetchUsuarioPorId(userData.id).then((user) => {
        if (user) {
          const parts = user.nome.split(" ");
          setNome(parts[0] || "");
          setSobrenome(parts.slice(1).join(" ") || "");
          setEmail(user.email);
        }
      });
    }
  }, []);

  const handleApplyAppearance = () => {
    localStorage.setItem("scopemaster_font_family", fontFamily);
    localStorage.setItem("scopemaster_font_size", fontSize);
    
    // Apply changes to DOM
    document.documentElement.style.setProperty("--font-size", `${fontSize}px`);
    document.documentElement.style.fontFamily = fontFamily === "Inter" 
      ? "Inter, sans-serif" 
      : fontFamily === "Roboto" 
      ? "Roboto, sans-serif" 
      : fontFamily === "Outfit"
      ? "Outfit, sans-serif"
      : "serif";
      
    showMessage("Aparência atualizada com sucesso!", "success");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !sobrenome) {
      showMessage("Nome e sobrenome são obrigatórios.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const nomeCompleto = `${nome} ${sobrenome}`.trim();
      await atualizarUsuario(userId, { nome: nomeCompleto });
      
      // Atualizar no localStorage
      const userDataString = localStorage.getItem("scopemaster_user");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        userData.name = nomeCompleto;
        localStorage.setItem("scopemaster_user", JSON.stringify(userData));
        
        // Dispatch event para atualizar o header
        window.dispatchEvent(new Event("storage"));
      }
      
      showMessage("Perfil atualizado com sucesso!", "success");
    } catch (err) {
      console.error(err);
      showMessage("Erro ao atualizar o perfil.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      showMessage("Preencha todos os campos de senha.", "error");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      showMessage("A nova senha e a confirmação não coincidem.", "error");
      return;
    }

    if (novaSenha.length < 6) {
      showMessage("A nova senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Validar a senha atual (suporta legado em texto puro e bcrypt)
      const user = await fetchUsuarioPorId(userId);
      const isBcrypt = user?.senha_hash?.startsWith('$2');
      const senhaCorreta = user && (
        isBcrypt
          ? await bcrypt.compare(senhaAtual, user.senha_hash)
          : senhaAtual === user.senha_hash
      );
      if (!senhaCorreta) {
        showMessage("Usuário ou senha incorretas.", "error");
        setIsLoading(false);
        return;
      }

      // 2. Criptografar e atualizar a nova senha
      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
      await atualizarUsuario(userId, { senha_hash: novaSenhaHash });
      showMessage("Senha atualizada com sucesso!", "success");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err) {
      console.error(err);
      showMessage("Erro ao atualizar a senha.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-foreground" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalize sua experiência e gerencie suas informações de conta.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' 
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Aparência */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Type className="w-5 h-5 text-purple-500" />
            Aparência e Acessibilidade
          </CardTitle>
          <CardDescription>
            Ajuste a fonte e o tamanho do texto para melhor leitura.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Fonte</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger id="fontFamily" className="bg-background border-border">
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Padrão)</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Outfit">Outfit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fontSize">Tamanho da Letra ({fontSize}px)</Label>
              <Input
                id="fontSize"
                type="range"
                min="12"
                max="24"
                step="1"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Pequeno</span>
                <span>Normal</span>
                <span>Grande</span>
              </div>
            </div>
          </div>
          <Button onClick={handleApplyAppearance} className="bg-foreground hover:bg-foreground/90 text-background">
            Aplicar Estilo
          </Button>
        </CardContent>
      </Card>

      {/* Perfil */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-foreground" />
            Perfil do Usuário
          </CardTitle>
          <CardDescription>
            Atualize suas informações pessoais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-background border-border"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sobrenome">Sobrenome</Label>
                <Input
                  id="sobrenome"
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  className="bg-background border-border"
                  placeholder="Seu sobrenome"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">E-mail (Não pode ser alterado)</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted text-muted-foreground border-border cursor-not-allowed"
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="bg-foreground hover:bg-foreground/90 text-background">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Perfil
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Segurança
          </CardTitle>
          <CardDescription>
            Atualize sua senha de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <Input
                  id="senhaAtual"
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="bg-background border-border"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="bg-background border-border"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="bg-background border-border"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
