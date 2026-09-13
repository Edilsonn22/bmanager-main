import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { gerarToken } from "../src/utils/jwt.js";
import { limiteFoiAtingido } from "../services/assinaturaService.js";
import crypto from "crypto";
import { enviarBoasVindas, enviarRecuperacaoSenha } from "../services/emailService.js";

const usuarioPublico = (usuario) => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  empresa_id: usuario.empresa_id,
  role: usuario.role,
});

export const register = async (req, res) => {
  let connection;

  try {
    const { nome, email, senha, empresa_nome: empresaNome, empresa_telefone: empresaTelefone, plano_id: planoIdRecebido } = req.body;
    if (!nome?.trim() || !email?.trim() || !senha || !empresaNome?.trim() || !empresaTelefone?.trim()) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }
    const digitosTelefone = empresaTelefone.replace(/\D/g, "");
    if (digitosTelefone.length < 8 || digitosTelefone.length > 15) {
      return res.status(400).json({ message: "Informe um contacto válido para a empresa." });
    }
    if (senha.length < 6) {
      return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const [existentes] = await pool.query(
      "SELECT id FROM Usuario WHERE email = ?", [emailNormalizado]
    );
    if (existentes.length) {
      return res.status(409).json({ message: "Este e-mail já está em uso." });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [empresa] = await connection.query(
      "INSERT INTO Empresa (nome, email, telefone) VALUES (?, ?, ?)",
      [empresaNome.trim(), emailNormalizado, empresaTelefone.trim()]
    );
    const senhaHash = await bcrypt.hash(senha, 12);
    const [usuario] = await connection.query(
      "INSERT INTO Usuario (nome, email, senha, empresa_id) VALUES (?, ?, ?, ?)",
      [nome.trim(), emailNormalizado, senhaHash, empresa.insertId]
    );
    const planoId = Number(planoIdRecebido);
    const [planos] = await connection.query(
      "SELECT id, preco FROM planos WHERE id = ? AND ativo = TRUE",
      [Number.isInteger(planoId) && planoId > 0 ? planoId : 1],
    );
    if (!planos[0]) {
      await connection.rollback();
      return res.status(400).json({ message: "O plano selecionado não está disponível." });
    }
    const gratuito = Number(planos[0].preco) === 0;
    await connection.query(
      gratuito
        ? "INSERT INTO assinaturas (empresa_id, plano_id, estado, inicia_em, expira_em) VALUES (?, ?, 'ativa', NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))"
        : "INSERT INTO assinaturas (empresa_id, plano_id, estado, inicia_em) VALUES (?, ?, 'pendente', NOW())",
      [empresa.insertId, planos[0].id],
    );
    await connection.commit();

    const novoUsuario = {
      id: usuario.insertId, nome: nome.trim(), email: emailNormalizado,
      empresa_id: empresa.insertId, role: "admin", token_version: 0, empresa_session_version: 0,
    };
    enviarBoasVindas({
      para: emailNormalizado,
      nome: novoUsuario.nome,
      empresa: empresaNome.trim(),
    });
    return res.status(201).json({
      message: "Conta criada com sucesso.",
      token: gerarToken(novoUsuario),
      usuario: novoUsuario,
      pagamentoNecessario: !gratuito,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro ao criar conta:", error);
    return res.status(500).json({ message: "Não foi possível criar a conta." });
  } finally {
    connection?.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email?.trim() || !senha) {
      return res.status(400).json({ message: "Informe o e-mail e a senha." });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const [administradores] = await pool.query(
      "SELECT id, nome, email, senha FROM AdministradorPlataforma WHERE email = ?", [emailNormalizado]
    );
    const administrador = administradores[0];
    if (administrador && await bcrypt.compare(senha, administrador.senha)) {
      const dono = { id: administrador.id, nome: administrador.nome, email: administrador.email, role: "platform_owner", tipo_conta: "platform_owner" };
      return res.json({ token: gerarToken(dono), usuario: dono });
    }

    const [usuarios] = await pool.query(
      `SELECT u.*, e.session_version AS empresa_session_version
       FROM Usuario u INNER JOIN Empresa e ON e.id = u.empresa_id WHERE u.email = ?`, [emailNormalizado]
    );
    const usuario = usuarios[0];
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ message: "E-mail ou senha inválidos." });
    }

    return res.json({ token: gerarToken(usuario), usuario: usuarioPublico(usuario) });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Não foi possível iniciar sessão." });
  }
};

export const solicitarRecuperacaoSenha = async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    let linkDesenvolvimento = null;
    if (email) {
      const [usuarios] = await pool.execute("SELECT id FROM Usuario WHERE email = ?", [email]);
      if (usuarios[0]) {
        const token = crypto.randomBytes(32).toString("hex");
        const hash = crypto.createHash("sha256").update(token).digest("hex");
        await pool.execute("DELETE FROM recuperacao_senha WHERE usuario_id = ? AND usado_em IS NULL", [usuarios[0].id]);
        await pool.execute("INSERT INTO recuperacao_senha (usuario_id, token_hash, expira_em) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))", [usuarios[0].id, hash]);
        const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/redefinir-senha?token=${token}`;
        const envio = await enviarRecuperacaoSenha({ para: email, link });
        if (!envio.enviado && process.env.NODE_ENV === "development") linkDesenvolvimento = link;
      }
    }
    return res.json({
      message: "Se o e-mail existir, receberá as instruções de recuperação.",
      ...(linkDesenvolvimento ? { link_desenvolvimento: linkDesenvolvimento } : {}),
    });
  } catch (error) {
    console.error("Erro ao solicitar recuperação:", error.message);
    return res.status(500).json({ message: "Não foi possível iniciar a recuperação." });
  }
};

export const redefinirSenha = async (req, res) => {
  let connection;
  try {
    const { token, senha } = req.body ?? {};
    if (!token || !senha || senha.length < 8) return res.status(400).json({ message: "Token e senha de pelo menos 8 caracteres são obrigatórios." });
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [tokens] = await connection.execute(
      "SELECT id, usuario_id FROM recuperacao_senha WHERE token_hash = ? AND usado_em IS NULL AND expira_em > NOW() FOR UPDATE",
      [hash]
    );
    if (!tokens[0]) {
      await connection.rollback();
      return res.status(400).json({ message: "Token inválido ou expirado." });
    }
    const senhaHash = await bcrypt.hash(senha, 12);
    await connection.execute("UPDATE Usuario SET senha = ?, token_version = token_version + 1 WHERE id = ?", [senhaHash, tokens[0].usuario_id]);
    await connection.execute("UPDATE recuperacao_senha SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL", [tokens[0].usuario_id]);
    await connection.commit();
    return res.json({ message: "Senha atualizada com sucesso." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro ao redefinir senha:", error.message);
    return res.status(500).json({ message: "Não foi possível redefinir a senha." });
  } finally {
    connection?.release();
  }
};

export const obterMinhaConta = async (req, res) => {
  try {
    const [contas] = await pool.execute(
      `SELECT u.id, u.nome, u.email, u.role, e.nome AS empresa_nome, e.nuit, e.email AS empresa_email,
              e.telefone AS empresa_telefone, e.endereco AS empresa_endereco
       FROM Usuario u INNER JOIN Empresa e ON e.id = u.empresa_id WHERE u.id = ? AND u.empresa_id = ?`,
      [req.user.id, req.user.empresa_id],
    );
    if (!contas[0]) return res.status(404).json({ message: "Utilizador não encontrado." });
    return res.json({ conta: contas[0] });
  } catch (error) {
    console.error("Erro ao consultar perfil:", error.message);
    return res.status(500).json({ message: "Não foi possível consultar o perfil." });
  }
};

export const atualizarMeuPerfil = async (req, res) => {
  const { nome, email } = req.body ?? {};
  if (!nome?.trim() || !email?.trim()) return res.status(400).json({ message: "Nome e e-mail são obrigatórios." });
  try {
    const emailNormalizado = email.trim().toLowerCase();
    const [existentes] = await pool.execute("SELECT id FROM Usuario WHERE email = ? AND id <> ?", [emailNormalizado, req.user.id]);
    if (existentes[0]) return res.status(409).json({ message: "Este e-mail já está em uso." });
    await pool.execute("UPDATE Usuario SET nome = ?, email = ? WHERE id = ? AND empresa_id = ?", [nome.trim(), emailNormalizado, req.user.id, req.user.empresa_id]);
    return res.json({ message: "Perfil atualizado com sucesso.", usuario: { nome: nome.trim(), email: emailNormalizado } });
  } catch (error) {
    return res.status(500).json({ message: "Não foi possível atualizar o perfil." });
  }
};

export const alterarMinhaSenha = async (req, res) => {
  const { senhaAtual, novaSenha } = req.body ?? {};
  if (!senhaAtual || !novaSenha || novaSenha.length < 6) return res.status(400).json({ message: "Informe a senha atual e uma nova senha de pelo menos 6 caracteres." });
  try {
    const [usuarios] = await pool.execute("SELECT senha FROM Usuario WHERE id = ? AND empresa_id = ?", [req.user.id, req.user.empresa_id]);
    if (!usuarios[0] || !(await bcrypt.compare(senhaAtual, usuarios[0].senha))) return res.status(401).json({ message: "Senha atual inválida." });
    await pool.execute("UPDATE Usuario SET senha = ?, token_version = token_version + 1 WHERE id = ?", [await bcrypt.hash(novaSenha, 12), req.user.id]);
    await pool.execute("UPDATE recuperacao_senha SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL", [req.user.id]);
    const [contas] = await pool.execute(`SELECT u.id, u.nome, u.email, u.empresa_id, u.role, u.token_version, e.session_version AS empresa_session_version FROM Usuario u INNER JOIN Empresa e ON e.id = u.empresa_id WHERE u.id = ?`, [req.user.id]);
    return res.json({ message: "Senha atualizada com sucesso.", token: gerarToken(contas[0]) });
  } catch (error) {
    return res.status(500).json({ message: "Não foi possível alterar a senha." });
  }
};

export const atualizarMinhaEmpresa = async (req, res) => {
  const { nome, nuit, email, telefone, endereco } = req.body ?? {};
  if (!nome?.trim()) return res.status(400).json({ message: "O nome da empresa é obrigatório." });
  try {
    await pool.execute(
      "UPDATE Empresa SET nome = ?, nuit = ?, email = ?, telefone = ?, endereco = ? WHERE id = ?",
      [nome.trim(), nuit?.trim() || null, email?.trim().toLowerCase() || null, telefone?.trim() || null, endereco?.trim() || null, req.user.empresa_id],
    );
    return res.json({ message: "Dados da empresa atualizados com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Não foi possível atualizar a empresa." });
  }
};

export const listarUsuariosDaEmpresa = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      "SELECT id, nome, email, role, created_at FROM Usuario WHERE empresa_id = ? ORDER BY nome ASC",
      [req.user.empresa_id]
    );
    return res.json({ usuarios });
  } catch (error) {
    console.error("Erro ao listar utilizadores:", error);
    return res.status(500).json({ message: "Não foi possível listar os utilizadores." });
  }
};

export const criarUsuarioDaEmpresa = async (req, res) => {
  try {
    const { nome, email, senha, role = "operador" } = req.body;
    if (!nome?.trim() || !email?.trim() || !senha) {
      return res.status(400).json({ message: "Nome, e-mail e senha são obrigatórios." });
    }
    if (senha.length < 6) return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
    if (!['gestor', 'operador'].includes(role)) return res.status(400).json({ message: "Papel inválido." });

    const emailNormalizado = email.trim().toLowerCase();
    const [existentes] = await pool.query("SELECT id FROM Usuario WHERE email = ?", [emailNormalizado]);
    if (existentes.length) return res.status(409).json({ message: "Este e-mail já está em uso." });

    const limite = await limiteFoiAtingido(req.user.empresa_id, "usuarios");
    if (limite.atingido) {
      return res.status(403).json({ message: `O limite de ${limite.limite} utilizadores do seu plano foi atingido.`, codigo: "LIMITE_USUARIOS" });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const [result] = await pool.execute(
      "INSERT INTO Usuario (nome, email, senha, empresa_id, role) VALUES (?, ?, ?, ?, ?)",
      [nome.trim(), emailNormalizado, senhaHash, req.user.empresa_id, role]
    );
    return res.status(201).json({ usuario: { id: result.insertId, nome: nome.trim(), email: emailNormalizado, role } });
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    return res.status(500).json({ message: "Não foi possível criar o utilizador." });
  }
};
