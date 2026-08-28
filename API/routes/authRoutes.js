import express from "express";

import {
  register,
  login,
  solicitarRecuperacaoSenha,
  redefinirSenha,
  listarUsuariosDaEmpresa,
  criarUsuarioDaEmpresa,
  obterMinhaConta,
  atualizarMeuPerfil,
  alterarMinhaSenha,
  atualizarMinhaEmpresa
} from "../controllers/authController.js";

import { auth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";
import { limiteLogin, limiteRecuperacao } from "../middlewares/rateLimit.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", limiteLogin, login);
router.post("/recuperar-senha", limiteRecuperacao, solicitarRecuperacaoSenha);
router.post("/redefinir-senha", redefinirSenha);

router.get("/perfil", auth, (req, res) => {

  res.json({
    usuario_id: req.user.id,
    empresa_id: req.user.empresa_id,
    role: req.user.role
  });

});
router.get("/minha-conta", auth, obterMinhaConta);
router.put("/perfil", auth, atualizarMeuPerfil);
router.put("/senha", auth, alterarMinhaSenha);
router.put("/empresa", auth, authorize("admin"), atualizarMinhaEmpresa);

router.get("/usuarios", auth, authorize("admin"), listarUsuariosDaEmpresa);
router.post("/usuarios", auth, authorize("admin"), verificarAssinatura, criarUsuarioDaEmpresa);

export default router;
