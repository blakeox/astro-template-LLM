// Minimal Cloudflare KV types to satisfy TS in non-Cloudflare builds
declare global {
	interface KVNamespaceGetOptions {
		type?: "text" | "json" | "arrayBuffer";
	}
	interface KVNamespacePutOptions {
		expiration?: number;
		expirationTtl?: number;
	}
	interface KVNamespace {
		get<T = unknown>(
			key: string,
			options?: KVNamespaceGetOptions,
		): Promise<T | null>;
		put(
			key: string,
			value: string,
			options?: KVNamespacePutOptions,
		): Promise<void>;
		delete(key: string): Promise<void>;
	}
}
export {};
