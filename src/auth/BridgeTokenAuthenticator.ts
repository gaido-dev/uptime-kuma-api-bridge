import { timingSafeEqual } from "node:crypto";

/** Verifies the bridge's own bearer token — a static secret, independent of Uptime Kuma's accounts. */
export class BridgeTokenAuthenticator {
    private readonly validTokens: Buffer[];

    constructor(configuredToken: string) {
        this.validTokens = [Buffer.from(configuredToken)];
    }

    verify(candidate: string | undefined): boolean {
        if (!candidate) {
            return false;
        }
        const candidateBuffer = Buffer.from(candidate);
        return this.validTokens.some(
            (token) => token.length === candidateBuffer.length && timingSafeEqual(token, candidateBuffer),
        );
    }
}
