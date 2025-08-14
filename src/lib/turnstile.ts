const TS_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const sha256 = async (s: string) =>
	Array.from(
		new Uint8Array(
			await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
		),
	)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

const replayKey = (h: string) => `ts:seen:${h}`;
const failKey = (h: string) => `ts:fail:${h}`;

type KV = {
	get<T = unknown>(
		key: string,
		options?: { type?: "text" | "json" | "arrayBuffer" },
	): Promise<T | null>;
	put(
		key: string,
		value: string,
		options?: { expiration?: number; expirationTtl?: number },
	): Promise<void>;
	delete(key: string): Promise<void>;
};

export async function verifyTurnstile({
	EDGE_STORE,
	secret,
	token,
	ip,
	salt,
}: {
	EDGE_STORE: KV;
	secret: string;
	token: string;
	ip?: string;
	salt: string;
}) {
	if (!token) return { ok: false, code: 400, err: "missing token" };

	const tokenHash = await sha256(token);
	const seen = await EDGE_STORE.get(replayKey(tokenHash));
	if (seen) return { ok: false, code: 429, err: "replayed token" };

	const res = await fetch(TS_VERIFY, {
		method: "POST",
		body: new URLSearchParams({ secret, response: token, remoteip: ip ?? "" }),
	});
	const body = (await res.json()) as {
		success: boolean;
		"error-codes"?: string[];
	};

	if (!body.success) {
		const ipHash = await sha256(`${salt || "s"}|${ip || ""}`);
		const k = failKey(ipHash);
		const current = Number.parseInt((await EDGE_STORE.get(k)) || "0", 10) || 0;
		await EDGE_STORE.put(k, String(current + 1), {
			expirationTtl: 3 * 60 * 60,
		});
		return {
			ok: false,
			code: 403,
			err: "turnstile failed",
			details: body["error-codes"] || [],
		};
	}

	await EDGE_STORE.put(replayKey(tokenHash), "1", { expirationTtl: 15 * 60 });
	return { ok: true };
}
