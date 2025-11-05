import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

import {fileURLToPath} from "url";
import {initDatabase, getReviewsByProductName, getProductReviewStats, closeDatabase} from "./database.js";
import {validatePackage, validateBasketIdent} from "./validators.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path: path.join(__dirname, ".env")});

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://headless.tebex.io", "https://plugin.tebex.io", "https://discord.com"],
            fontSrc: ["'self'", "data:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

const globalLimiter = rateLimit({windowMs: 15*60*1000, max: 100, message: {error: "Too many requests from this IP, please try again later."}, standardHeaders: true, legacyHeaders: false});

app.use(globalLimiter);

const strictLimiter = rateLimit({windowMs: 15*60*1000, max: 20, message: {error: "Too many requests, please slow down."}});

app.use(cors({origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true}));

app.use(express.json({limit: "10mb"}));

const TEBEX_PUBLIC_TOKEN = process.env.TEBEX_PUBLIC_TOKEN;
const TEBEX_PRIVATE_KEY = process.env.TEBEX_PRIVATE_KEY;
const TEBEX_SERVER_SECRET = process.env.TEBEX_SERVER_SECRET;
const HEADLESS_API_BASE = "https://headless.tebex.io/api";
const PLUGIN_API_BASE = "https://plugin.tebex.io";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

console.log("✅ Backend Configuration:");
console.log("TEBEX_PUBLIC_TOKEN:", TEBEX_PUBLIC_TOKEN ? "Loaded" : "❌ Missing");
console.log("TEBEX_PRIVATE_KEY:", TEBEX_PRIVATE_KEY ? "Loaded" : "❌ Missing");
console.log("TEBEX_SERVER_SECRET:", TEBEX_SERVER_SECRET ? "Loaded" : "❌ Missing");
console.log("DISCORD_CLIENT_ID:", DISCORD_CLIENT_ID ? "Loaded" : "❌ Missing");
console.log("DISCORD_CLIENT_SECRET:", DISCORD_CLIENT_SECRET ? "Loaded" : "❌ Missing");
console.log("DISCORD_BOT_TOKEN:", DISCORD_BOT_TOKEN ? "Loaded" : "❌ Missing");
console.log("DISCORD_GUILD_ID:", DISCORD_GUILD_ID ? "Loaded" : "❌ Missing");

app.get("/api/health", (req, res) => {
    res.json({status: "ok", message: "ULOG Tebex Backend V2", timestamp: new Date().toISOString()});
});

app.get("/api/tebex/categories", async (req, res) => {
    try {
        if (!TEBEX_PUBLIC_TOKEN) {
            return res.status(500).json({error: "Tebex token not configured"});
        }
        const response = await fetch(`${HEADLESS_API_BASE}/accounts/${TEBEX_PUBLIC_TOKEN}/categories?includePackages=1`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return res.status(response.status).json({error: "Failed to fetch categories", details: error});
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.get("/api/tebex/packages", async (req, res) => {
    try {
        if (!TEBEX_PUBLIC_TOKEN) {
            return res.status(500).json({error: "Tebex token not configured"});
        }
        const response = await fetch(`${HEADLESS_API_BASE}/accounts/${TEBEX_PUBLIC_TOKEN}/packages`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return res.status(response.status).json({error: "Failed to fetch packages", details: error});
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.get("/api/tebex/packages/:packageId", async (req, res) => {
    try {
        if (!TEBEX_PUBLIC_TOKEN) {
            return res.status(500).json({error: "Tebex token not configured"});
        }
        const {packageId} = req.params;
        const response = await fetch(`${HEADLESS_API_BASE}/accounts/${TEBEX_PUBLIC_TOKEN}/packages/${packageId}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return res.status(response.status).json({error: "Failed to fetch package", details: error});
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.get("/api/tebex/payments/recent", async (req, res) => {
    try {
        if (!TEBEX_SERVER_SECRET) {
            return res.status(500).json({error: "Tebex server secret not configured"});
        }
        const limit = req.query.limit || 10;
        const response = await fetch(`${PLUGIN_API_BASE}/payments?limit=${limit}`, {headers: {"X-Tebex-Secret": TEBEX_SERVER_SECRET}});
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return res.status(response.status).json({error: "Failed to fetch payments", details: error});
        }
        const data = await response.json();
        const payments = Array.isArray(data) ? data : [];
        res.json(payments);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.post("/api/tebex/baskets", strictLimiter, async (req, res) => {
    try {
        if (!TEBEX_PUBLIC_TOKEN) {
            return res.status(500).json({error: "Tebex token not configured"});
        }
        const {complete_url, cancel_url, custom} = req.body;
        const basketPayload = {complete_url: complete_url || `${process.env.FRONTEND_URL}/checkout/complete`, cancel_url: cancel_url || `${process.env.FRONTEND_URL}/products`, complete_auto_redirect: false, custom: custom || {}};
        const response = await fetch(`${HEADLESS_API_BASE}/accounts/${TEBEX_PUBLIC_TOKEN}/baskets`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(basketPayload)});
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return res.status(response.status).json({error: "Failed to create basket", details: error});
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.post("/api/tebex/baskets/:basketIdent/packages", strictLimiter, async (req, res) => {
    try {
        const {basketIdent} = req.params;
        const identValidation = validateBasketIdent(basketIdent);
        if (identValidation.error) {
            return res.status(400).json({error: "Invalid basket identifier"});
        }
        const {error, value} = validatePackage(req.body);
        if (error) {
            return res.status(400).json({error: "Invalid input", details: error.details[0].message});
        }
        const response = await fetch(`${HEADLESS_API_BASE}/baskets/${basketIdent}/packages`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(value)});
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return res.status(response.status).json({error: "Failed to add package", details: error});
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.get("/api/tebex/baskets/:basketIdent/auth", async (req, res) => {
    try {
        if (!TEBEX_PUBLIC_TOKEN) {
            return res.status(500).json({error: "Tebex token not configured"});
        }
        const {basketIdent} = req.params;
        const {returnUrl} = req.query;
        const response = await fetch(`${HEADLESS_API_BASE}/accounts/${TEBEX_PUBLIC_TOKEN}/baskets/${basketIdent}/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return res.status(response.status).json({error: "Failed to get auth URL", details: error});
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.get("/api/tebex/baskets/:basketIdent", async (req, res) => {
    try {
        if (!TEBEX_PUBLIC_TOKEN) {
            return res.status(500).json({error: "Tebex token not configured"});
        }
        const {basketIdent} = req.params;
        const response = await fetch(`${HEADLESS_API_BASE}/accounts/${TEBEX_PUBLIC_TOKEN}/baskets/${basketIdent}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return res.status(response.status).json({error: "Failed to get basket", details: error});
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.post("/api/discord/token", strictLimiter, async (req, res) => {
    try {
        const {code} = req.body;
        if (!code) {
            return res.status(400).json({error: "Authorization code required"});
        }
        if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
            return res.status(500).json({error: "Discord OAuth not configured"});
        }
        const params = new URLSearchParams({client_id: DISCORD_CLIENT_ID, client_secret: DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code: code, redirect_uri: DISCORD_REDIRECT_URI});
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: params});
        if (!tokenResponse.ok) {
            const error = await tokenResponse.json().catch(() => ({}));
            return res.status(tokenResponse.status).json({error: "Failed to exchange code for token", details: error});
        }
        const tokenData = await tokenResponse.json();

        // Adicionar o usuário ao servidor Discord automaticamente
        if (DISCORD_BOT_TOKEN && DISCORD_GUILD_ID && tokenData.access_token) {
            try {
                // Primeiro, obter o ID do usuário
                const userResponse = await fetch("https://discord.com/api/users/@me", {
                    headers: {Authorization: `Bearer ${tokenData.access_token}`}
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    const userId = userData.id;

                    // Adicionar o usuário ao servidor
                    const addMemberResponse = await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`, {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            access_token: tokenData.access_token
                        })
                    });

                    if (addMemberResponse.ok || addMemberResponse.status === 204) {
                        console.log(`✅ Usuário ${userData.username} adicionado ao servidor Discord`);
                    } else if (addMemberResponse.status === 403) {
                        console.warn("⚠️ Bot não tem permissão para adicionar membros ao servidor");
                    } else {
                        const errorData = await addMemberResponse.json().catch(() => ({}));
                        console.warn("⚠️ Não foi possível adicionar o usuário ao servidor:", errorData);
                    }
                }
            } catch (error) {
                console.warn("⚠️ Erro ao adicionar usuário ao servidor Discord:", error.message);
                // Não falhar a autenticação se não conseguir adicionar ao servidor
            }
        }

        res.json(tokenData);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});

app.get("/api/reviews/product/:productName", async (req, res) => {
    try {
        const productName = decodeURIComponent(req.params.productName);
        const [reviews, stats] = await Promise.all([getReviewsByProductName(productName), getProductReviewStats(productName)]);
        res.json({success: true, product: productName, stats: stats, reviews: reviews});
    } catch (error) {
        res.status(500).json({success: false, error: "Failed to fetch reviews", reviews: [], stats: {total: 0, averageRating: 0}});
    }
});

const PORT = process.env.PORT || 3001;

initDatabase().catch(err => {});

process.on("SIGINT", async () => {
    await closeDatabase();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await closeDatabase();
    process.exit(0);
});

app.listen(PORT, () => {});